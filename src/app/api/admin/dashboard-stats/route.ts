import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// Enhanced timeout configuration for Supabase calls
const SUPABASE_TIMEOUT = 30000 // 30 seconds increased from default 10s
const MAX_RETRIES = 3
const BASE_RETRY_DELAY = 1000 // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Enhanced error logging utility
 */
function logDetailedError(operation: string, error: any, attempt: number = 1) {
  const errorInfo = {
    operation,
    attempt,
    timestamp: new Date().toISOString(),
    errorType: error?.constructor?.name || 'Unknown',
    message: error?.message,
    code: error?.code,
    cause: error?.cause,
    stack: error?.stack,
    // Network-specific error details
    ...(error?.cause && {
      networkError: {
        code: error.cause.code,
        message: error.cause.message,
        addresses: error.cause.addresses || 'unknown',
        timeout: error.cause.timeout || 'unknown'
      }
    })
  }
  
  console.error(`🔍 DETAILED ERROR LOG [${operation}]:`, JSON.stringify(errorInfo, null, 2))
  return errorInfo
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now()
      console.log(`🔄 RETRY ATTEMPT ${attempt}/${maxRetries} for ${operationName}`)
      
      const result = await operation()
      const duration = Date.now() - startTime
      
      console.log(`✅ SUCCESS [${operationName}] in ${duration}ms on attempt ${attempt}`)
      return result
      
    } catch (error) {
      lastError = error
      const errorInfo = logDetailedError(operationName, error, attempt)
      
      if (attempt === maxRetries) {
        console.error(`❌ FINAL FAILURE [${operationName}] after ${maxRetries} attempts`)
        break
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1)
      console.log(`⏳ RETRY DELAY: ${delay}ms before attempt ${attempt + 1}`)
      await sleep(delay)
    }
  }
  
  throw lastError
}

/**
 * Enhanced Supabase query with timeout and retry
 */
async function executeSupabaseQuery(supabase: any, queryName: string, queryFn: () => any) {
  const startTime = Date.now()
  
  console.log(`🚀 STARTING QUERY [${queryName}] at ${new Date().toISOString()}`)
  
  return retryOperation(async () => {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout after ${SUPABASE_TIMEOUT}ms: ${queryName}`))
      }, SUPABASE_TIMEOUT)
    })
    
    // Race between the query and timeout
    const result = await Promise.race([
      queryFn(),
      timeoutPromise
    ])
    
    const duration = Date.now() - startTime
    console.log(`✅ QUERY COMPLETED [${queryName}] in ${duration}ms`)
    
    return result
  }, `SUPABASE_QUERY_${queryName}`)
}

/**
 * GET /api/admin/dashboard-stats
 * 
 * Enhanced version with detailed logging, retry logic, and timeout handling
 * Fetches admin dashboard statistics with comprehensive error diagnostics
 */
export async function GET(_request: NextRequest) {
  const requestStartTime = Date.now()
  const requestId = Math.random().toString(36).substr(2, 9)
  
  try {
    console.log(`📊 ADMIN DASHBOARD STATS [${requestId}] - Starting enhanced fetch at ${new Date().toISOString()}`)
    
    const supabase = createAdminClient()
    console.log(`🔧 SUPABASE CLIENT - Created admin client with timeout: ${SUPABASE_TIMEOUT}ms, retries: ${MAX_RETRIES}`)
    
    // Enhanced parallel queries with individual retry and timeout handling
    console.log(`🚀 STARTING PARALLEL QUERIES [${requestId}] - 6 queries with enhanced error handling`)
    
    const [
      businessesResult,
      customersResult,
      customerCardsResult,
      stampCardsResult,
      membershipCardsResult,
      flaggedBusinessesResult
    ] = await Promise.all([
      executeSupabaseQuery(supabase, 'BUSINESSES_COUNT', 
        () => supabase.from('businesses').select('id', { count: 'exact' })),
      executeSupabaseQuery(supabase, 'CUSTOMERS_COUNT',
        () => supabase.from('customers').select('id', { count: 'exact' })),
      executeSupabaseQuery(supabase, 'CUSTOMER_CARDS_COUNT',
        () => supabase.from('customer_cards').select('id', { count: 'exact' })),
      executeSupabaseQuery(supabase, 'STAMP_CARDS_COUNT',
        () => supabase.from('stamp_cards').select('id', { count: 'exact' })),
      executeSupabaseQuery(supabase, 'MEMBERSHIP_CARDS_COUNT',
        () => supabase.from('membership_cards').select('id', { count: 'exact' })),
      executeSupabaseQuery(supabase, 'FLAGGED_BUSINESSES_COUNT',
        () => supabase.from('businesses').select('id', { count: 'exact' }).eq('is_flagged', true))
    ])

    const queryDuration = Date.now() - requestStartTime
    console.log(`✅ ALL QUERIES COMPLETED [${requestId}] in ${queryDuration}ms`)

    // Enhanced error checking with detailed diagnostics
    const queryResults = [
      { name: 'businesses', result: businessesResult },
      { name: 'customers', result: customersResult },
      { name: 'customer_cards', result: customerCardsResult },
      { name: 'stamp_cards', result: stampCardsResult },
      { name: 'membership_cards', result: membershipCardsResult },
      { name: 'flagged_businesses', result: flaggedBusinessesResult }
    ]

    const errors = queryResults
      .filter(({ result }) => result.error)
      .map(({ name, result }) => ({
        query: name,
        message: result.error?.message,
        details: result.error?.details,
        hint: result.error?.hint,
        code: result.error?.code
      }))

    if (errors.length > 0) {
      console.error(`❌ ADMIN DASHBOARD STATS [${requestId}] - Database errors:`, errors)
      
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        diagnostics: {
          requestId,
          timestamp: new Date().toISOString(),
          duration: Date.now() - requestStartTime,
          failedQueries: errors,
          totalQueries: queryResults.length,
          successfulQueries: queryResults.length - errors.length,
          timeout: SUPABASE_TIMEOUT,
          maxRetries: MAX_RETRIES
        }
      }, { status: 500 })
    }

    // Calculate statistics with validation
    const stats = {
      totalBusinesses: businessesResult.count || 0,
      totalCustomers: customersResult.count || 0,
      totalCards: customerCardsResult.count || 0,
      totalStampCards: stampCardsResult.count || 0,
      totalMembershipCards: membershipCardsResult.count || 0,
      flaggedBusinesses: flaggedBusinessesResult.count || 0,
      recentActivity: customerCardsResult.count || 0 // Using customer cards as activity metric
    }

    const totalDuration = Date.now() - requestStartTime
    console.log(`✅ ADMIN DASHBOARD STATS [${requestId}] - Statistics calculated in ${totalDuration}ms:`, stats)

    return NextResponse.json({
      success: true,
      data: {
        stats
      },
      diagnostics: {
        requestId,
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        queryCount: queryResults.length,
        timeout: SUPABASE_TIMEOUT,
        maxRetries: MAX_RETRIES
      }
    })

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime
    const errorInfo = logDetailedError('DASHBOARD_STATS_MAIN', error)
    
    console.error(`❌ ADMIN DASHBOARD STATS [${requestId}] - Critical error after ${totalDuration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
      diagnostics: {
        requestId,
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        timeout: SUPABASE_TIMEOUT,
        maxRetries: MAX_RETRIES,
        errorDetails: errorInfo
      }
    }, { status: 500 })
  }
}