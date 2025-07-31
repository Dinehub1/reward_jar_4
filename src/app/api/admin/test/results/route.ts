import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import validateUUID from 'uuid-validate'

// Winston logger for wallet errors
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'wallet-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'wallet-combined.log' })
  ]
})

function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }
  return validateUUID(uuid)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if test_results table exists
    const { error: tableCheckError } = await supabase
      .from('test_results')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.warn('⚠️ test_results table not found, returning graceful fallback')
      logger.warn('test_results table not found', { error: tableCheckError.message })
      
      return NextResponse.json({
        success: false,
        message: 'Test results table not configured. Please run the migration script.',
        error: 'table_not_found',
        help: 'Run: psql -d your_database -f scripts/create-test-results-table.sql'
      }, { status: 200 }) // Return 200 with helpful message instead of 500
    }

    const body = await request.json()
    const { card_id, test_type, status, duration_ms, response_size_kb, error_message } = body

    // Validate required fields
    if (!card_id || !test_type || !status) {
      const errorMsg = 'Missing required fields: card_id, test_type, and status are required'
      logger.error('Validation failed: missing required fields', {
        provided: { card_id: !!card_id, test_type: !!test_type, status: !!status },
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: false,
        error: 'validation_error',
        message: errorMsg,
        details: 'Ensure all required fields are provided in the request body'
      }, { status: 400 })
    }

    // Validate UUID format for card_id using uuid-validate library
    if (!isValidUUID(card_id)) {
      const errorMsg = 'Invalid UUID format for card_id'
      console.error('❌ UUID validation failed:', { card_id, test_type })
      logger.error('UUID validation failed', {
        card_id,
        test_type,
        error: errorMsg,
        expected_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: false,
        error: 'invalid_uuid',
        message: errorMsg,
        details: 'card_id must be a valid UUID in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        provided: card_id
      }, { status: 400 })
    }

    console.log('📝 Creating test result:', { test_type, status, duration_ms, card_id: card_id.substring(0, 8) + '...' })

    // Cast duration_ms and response_size_kb to integers to prevent type mismatch
    const durationInteger = Math.floor(parseFloat(duration_ms) || 0)
    const responseSizeInteger = Math.floor(parseFloat(response_size_kb) || 0)

    const { data, error } = await supabase
      .from('test_results')
      .insert({
        card_id,
        test_type,
        status,
        duration_ms: durationInteger,
        response_size_kb: responseSizeInteger,
        error_message: error_message || null,
        test_url: null,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('❌ Error creating test result:', error)
      logger.error('Failed to create test result', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        test_type,
        card_id: card_id.substring(0, 8) + '...',
        duration_ms: durationInteger,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    console.log('✅ Test result created successfully:', data?.[0]?.id)
    logger.info('Test result created successfully', {
      test_type,
      status,
      duration_ms: durationInteger,
      response_size_kb: responseSizeInteger,
      card_id: card_id.substring(0, 8) + '...',
      result_id: data?.[0]?.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('❌ Unexpected error in test results API:', error)
    logger.error('Unexpected error in test results API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const testType = searchParams.get('test_type') || 'all'

    console.log('📊 Fetching test results:', { limit, testType })

    // Check if test_results table exists
    const { error: tableCheckError } = await supabase
      .from('test_results')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.warn('⚠️ test_results table not found, returning empty results')
      logger.warn('test_results table not found for GET request', { 
        error: tableCheckError.message,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'Test results table not configured. Set up the database schema to enable result tracking.',
        setup_required: true
      })
    }

    let query = supabase
      .from('test_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (testType !== 'all') {
      query = query.eq('test_type', testType)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching test results:', error)
      logger.error('Failed to fetch test results', {
        error: error.message,
        code: error.code,
        testType,
        limit,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    const successCount = data?.filter(result => result.status === 'success').length || 0
    const total = data?.length || 0
    const successRate = total > 0 ? ((successCount / total) * 100).toFixed(2) : '0.00'

    console.log('✅ Test results fetched:', { total, recent: total, successRate: `${successRate}%` })

    return NextResponse.json({
      success: true,
      data: data || [],
      total,
      successRate: `${successRate}%`,
      recent: total
    })

  } catch (error) {
    console.error('❌ Unexpected error fetching test results:', error)
    logger.error('Unexpected error fetching test results', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if test_results table exists
    const { error: tableCheckError } = await supabase
      .from('test_results')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.warn('⚠️ test_results table not found for DELETE')
      logger.warn('test_results table not found for DELETE request', { 
        error: tableCheckError.message,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: true,
        message: 'No test results to clear (table not configured)',
        cleared: 0
      })
    }

    const { error } = await supabase
      .from('test_results')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (error) {
      console.error('❌ Error clearing test results:', error)
      logger.error('Failed to clear test results', {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('🗑️ Test results cleared successfully')
    logger.info('Test results cleared successfully', {
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Test results cleared successfully',
      cleared: 'all'
    })

  } catch (error) {
    console.error('❌ Unexpected error clearing test results:', error)
    logger.error('Unexpected error clearing test results', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 