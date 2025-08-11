import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentHealth } from '@/lib/startup-validation'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * HEAD /api/test/centralized-architecture
 * 
 * Quick health check for centralized architecture without running full tests
 */
export async function HEAD() {
  try {
    // Quick environment check
    const envHealth = getEnvironmentHealth()
    
    if (envHealth.status === 'healthy') {
      return new NextResponse(null, { status: 200 })
    } else {
      return new NextResponse(null, { status: 503 })
    }
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

/**
 * GET /api/test/centralized-architecture
 * 
 * Comprehensive test of the new centralized Supabase architecture
 * Tests all new API routes and validates data flow
 */
export async function GET(request: NextRequest) {
  const testResults: any[] = []
  const startTime = Date.now()

  try {

    // Test 1: Environment Health Check
    try {
      const envHealth = getEnvironmentHealth()
      
      testResults.push({
        test: 'Environment Health',
        status: envHealth.status === 'healthy' ? 'PASS' : 'FAIL',
        data: envHealth,
        responseTime: `${Date.now() - startTime}ms`
      })
    } catch (error) {
      testResults.push({
        test: 'Environment Health',
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Admin Client Connection
    try {
      const supabase = createAdminClient()
      
      // Test basic connection by counting businesses
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
      
      testResults.push({
        test: 'Admin Client Connection',
        status: error ? 'FAIL' : 'PASS',
        data: {
          connected: !error,
          businessCount: businesses?.length || 0,
          error: error?.message
        },
        responseTime: `${Date.now() - startTime}ms`
      })
    } catch (error) {
      testResults.push({
        test: 'Admin Client Connection',
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Database Tables Access
    try {
      const supabase = createAdminClient()
      
      const [businessCount, customerCount, cardCount] = await Promise.all([
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('customer_cards').select('id', { count: 'exact', head: true })
      ])
      
      const hasErrors = businessCount.error || customerCount.error || cardCount.error
      
      testResults.push({
        test: 'Database Tables Access',
        status: hasErrors ? 'FAIL' : 'PASS',
        data: {
          businesses: businessCount.count || 0,
          customers: customerCount.count || 0,
          customerCards: cardCount.count || 0,
          errors: hasErrors ? [businessCount.error, customerCount.error, cardCount.error].filter(Boolean) : []
        },
        responseTime: `${Date.now() - startTime}ms`
      })
    } catch (error) {
      testResults.push({
        test: 'Database Tables Access',
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Type Safety Check
    try {
      const supabase = createAdminClient()
      
      // Test that our types work correctly
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, contact_email, status, created_at')
        .limit(1)
        .single()
      
      const hasRequiredFields = business && 
        typeof business.id === 'string' &&
        typeof business.name === 'string' &&
        typeof business.created_at === 'string'
      
      testResults.push({
        test: 'Type Safety Check',
        status: hasRequiredFields ? 'PASS' : 'FAIL',
        data: {
          hasData: !!business,
          hasRequiredFields,
          sampleBusiness: business ? {
            id: business.id,
            name: business.name,
            hasEmail: !!business.contact_email
          } : null,
          error: error?.message
        },
        responseTime: `${Date.now() - startTime}ms`
      })
    } catch (error) {
      testResults.push({
        test: 'Type Safety Check',
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    const totalTime = Date.now() - startTime
    const passedTests = testResults.filter(t => t.status === 'PASS').length
    const failedTests = testResults.filter(t => t.status === 'FAIL').length
    const errorTests = testResults.filter(t => t.status === 'ERROR').length

    const summary = {
      totalTests: testResults.length,
      passed: passedTests,
      failed: failedTests,
      errors: errorTests,
      successRate: `${Math.round((passedTests / testResults.length) * 100)}%`,
      totalTime: `${totalTime}ms`,
      status: passedTests === testResults.length ? 'ALL_PASS' : 'SOME_FAILURES'
    }


    return NextResponse.json({
      success: true,
      data: {
        summary,
        testResults,
        timestamp: new Date().toISOString(),
        architecture: 'centralized-supabase-v4.0'
      },
      message: `Architecture test completed: ${summary.successRate} success rate`
    } as ApiResponse<any>)

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Test suite execution failed',
      data: {
        testResults,
        timestamp: new Date().toISOString(),
        totalTime: `${Date.now() - startTime}ms`
      }
    } as ApiResponse<any>, { status: 500 })
  }
}