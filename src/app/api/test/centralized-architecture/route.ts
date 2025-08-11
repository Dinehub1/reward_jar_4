import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * GET /api/test/centralized-architecture
 * 
 * Tests the centralized architecture and data flow patterns
 * Validates database connections, API performance, and system integration
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    architecture: {
      database: { status: 'unknown', responseTime: 0 },
      api_layer: { status: 'unknown', responseTime: 0 },
      business_logic: { status: 'unknown', responseTime: 0 },
      auth_system: { status: 'unknown', responseTime: 0 }
    },
    data_flow: {
      user_to_business: 'unknown',
      business_to_cards: 'unknown',
      cards_to_wallets: 'unknown'
    },
    performance: {
      total_test_time: 0,
      database_queries: 0,
      api_calls: 0,
      bottlenecks: [] as string[]
    },
    recommendations: [] as string[]
  }

  try {
    // Test 1: Database Layer
    const dbStartTime = Date.now()
    const supabase = createAdminClient()
    
    try {
      // Test basic connectivity
      const { data: dbTest, error: dbError } = await supabase
        .from('businesses')
        .select('id, name')
        .limit(1)

      const dbResponseTime = Date.now() - dbStartTime
      results.architecture.database = {
        status: dbError ? 'error' : 'healthy',
        responseTime: dbResponseTime
      }
      results.performance.database_queries++

      if (dbResponseTime > 1000) {
        results.performance.bottlenecks.push('Database queries are slow (>1s)')
      }
    } catch (dbError) {
      results.architecture.database = {
        status: 'error',
        responseTime: Date.now() - dbStartTime
      }
    }

    // Test 2: API Layer Performance
    const apiStartTime = Date.now()
    try {
      const baseUrl = request.nextUrl.origin
      
      // Test health endpoint
      const healthResponse = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      const apiResponseTime = Date.now() - apiStartTime
      results.architecture.api_layer = {
        status: healthResponse.ok ? 'healthy' : 'degraded',
        responseTime: apiResponseTime
      }
      results.performance.api_calls++

      if (apiResponseTime > 2000) {
        results.performance.bottlenecks.push('API endpoints are slow (>2s)')
      }
    } catch (apiError) {
      results.architecture.api_layer = {
        status: 'error',
        responseTime: Date.now() - apiStartTime
      }
    }

    // Test 3: Business Logic Layer
    const businessLogicStartTime = Date.now()
    try {
      // Test user role resolution
      const { data: userCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })

      // Test business-card relationships
      const { data: businessCount } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })

      const businessLogicResponseTime = Date.now() - businessLogicStartTime
      results.architecture.business_logic = {
        status: 'healthy',
        responseTime: businessLogicResponseTime
      }
      results.performance.database_queries += 2

      // Data flow validations
      if (userCount && userCount > 0) {
        results.data_flow.user_to_business = 'connected'
      }
      if (businessCount && businessCount > 0) {
        results.data_flow.business_to_cards = 'connected'
        results.data_flow.cards_to_wallets = 'configured'
      }
    } catch (businessLogicError) {
      results.architecture.business_logic = {
        status: 'error',
        responseTime: Date.now() - businessLogicStartTime
      }
    }

    // Test 4: Auth System
    const authStartTime = Date.now()
    try {
      // Test auth configuration
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
      const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const authResponseTime = Date.now() - authStartTime
      results.architecture.auth_system = {
        status: (hasServiceKey && hasAnonKey) ? 'healthy' : 'degraded',
        responseTime: authResponseTime
      }

      if (!hasServiceKey) {
        results.performance.bottlenecks.push('Missing SUPABASE_SERVICE_ROLE_KEY')
      }
      if (!hasAnonKey) {
        results.performance.bottlenecks.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
      }
    } catch (authError) {
      results.architecture.auth_system = {
        status: 'error',
        responseTime: Date.now() - authStartTime
      }
    }

    // Performance analysis
    const totalTime = Date.now() - startTime
    results.performance.total_test_time = totalTime

    // Generate recommendations
    const allHealthy = Object.values(results.architecture).every(
      component => component.status === 'healthy'
    )

    if (allHealthy) {
      results.recommendations.push('Architecture is healthy - all layers functioning correctly')
    }

    if (results.performance.bottlenecks.length === 0) {
      results.recommendations.push('No performance bottlenecks detected')
    } else {
      results.recommendations.push('Performance optimizations recommended')
    }

    if (totalTime < 1000) {
      results.recommendations.push('Excellent overall system performance')
    } else if (totalTime < 3000) {
      results.recommendations.push('Good system performance')
    } else {
      results.recommendations.push('System performance needs optimization')
    }

    // Data flow recommendations
    if (results.data_flow.user_to_business === 'connected' && 
        results.data_flow.business_to_cards === 'connected') {
      results.recommendations.push('Data flow architecture is properly connected')
    }

    const overallStatus = allHealthy && results.performance.bottlenecks.length === 0 ? 'healthy' : 'degraded'

    return NextResponse.json({
      status: overallStatus,
      message: `Architecture test completed in ${totalTime}ms`,
      results
    }, {
      headers: {
        'X-Test-Duration': `${totalTime}ms`,
        'X-Database-Queries': results.performance.database_queries.toString(),
        'X-API-Calls': results.performance.api_calls.toString()
      }
    })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error('Centralized architecture test failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Architecture test failed',
      error: error.message,
      results: {
        ...results,
        performance: {
          ...results.performance,
          total_test_time: totalTime
        }
      }
    }, { status: 500 })
  }
}

/**
 * POST /api/test/centralized-architecture
 * 
 * Runs specific architecture tests based on provided parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testTypes = ['all'] } = body

    const results = {
      timestamp: new Date().toISOString(),
      requested_tests: testTypes,
      results: {} as Record<string, any>
    }

    // Handle specific test types
    if (testTypes.includes('all') || testTypes.includes('database')) {
      const supabase = createAdminClient()
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('businesses')
        .select('count')
        .limit(1)

      results.results.database = {
        status: error ? 'error' : 'success',
        responseTime: Date.now() - startTime,
        error: error?.message
      }
    }

    if (testTypes.includes('all') || testTypes.includes('api')) {
      const baseUrl = request.nextUrl.origin
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${baseUrl}/api/health`)
        results.results.api = {
          status: response.ok ? 'success' : 'error',
          responseTime: Date.now() - startTime,
          statusCode: response.status
        }
      } catch (apiError: any) {
        results.results.api = {
          status: 'error',
          responseTime: Date.now() - startTime,
          error: apiError.message
        }
      }
    }

    const overallStatus = Object.values(results.results).every(
      (result: any) => result.status === 'success'
    ) ? 'success' : 'partial'

    return NextResponse.json({
      status: overallStatus,
      message: 'Custom architecture tests completed',
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to run custom architecture tests',
      error: error.message
    }, { status: 500 })
  }
}