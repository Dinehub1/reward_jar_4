import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const testType = searchParams.get('test_type') || 'all'

    console.log('📊 Fetching test results:', { limit, testType })

    // Check if test_results table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('test_results')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.warn('⚠️ test_results table does not exist:', tableCheckError.message)
      
      // Return empty results with default metrics
      return NextResponse.json({
        success: true,
        results: [],
        performance_metrics: {
          total_tests: 0,
          successful_tests: 0,
          failed_tests: 0,
          pending_tests: 0,
          success_rate: 0,
          avg_duration_ms: 0,
          avg_response_size_kb: 0,
          test_type_breakdown: [],
          time_period: '24h'
        },
        count: 0,
        timestamp: new Date().toISOString(),
        message: 'test_results table not found - run SQL script to create it'
      })
    }

    // Build query based on test type
    let query = supabase
      .from('test_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (testType !== 'all') {
      query = query.eq('test_type', testType)
    }

    const { data: testResults, error } = await query

    if (error) {
      console.error('❌ Error fetching test results:', error)
      throw error
    }

    // Calculate performance metrics
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentResults = testResults?.filter(result => 
      new Date(result.created_at) >= last24Hours
    ) || []

    const totalTests = recentResults.length
    const successfulTests = recentResults.filter(r => r.status === 'success').length
    const failedTests = recentResults.filter(r => r.status === 'error').length
    const pendingTests = recentResults.filter(r => r.status === 'pending').length

    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0
    
    const durations = recentResults
      .filter(r => r.duration_ms > 0)
      .map(r => r.duration_ms)
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0

    const sizes = recentResults
      .filter(r => r.response_size_kb > 0)
      .map(r => r.response_size_kb)
    const avgSize = sizes.length > 0 
      ? sizes.reduce((a, b) => a + b, 0) / sizes.length 
      : 0

    // Get test type breakdown
    const testTypeBreakdown = ['apple', 'google', 'pwa'].map(type => {
      const typeResults = recentResults.filter(r => r.test_type === type)
      const typeSuccessful = typeResults.filter(r => r.status === 'success').length
      const typeTotal = typeResults.length
      
      return {
        test_type: type,
        total_tests: typeTotal,
        successful_tests: typeSuccessful,
        failed_tests: typeResults.filter(r => r.status === 'error').length,
        success_rate: typeTotal > 0 ? (typeSuccessful / typeTotal) * 100 : 0,
        avg_duration_ms: typeResults.length > 0 
          ? typeResults.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / typeResults.length 
          : 0,
        avg_response_size_kb: typeResults.length > 0 
          ? typeResults.reduce((sum, r) => sum + (r.response_size_kb || 0), 0) / typeResults.length 
          : 0
      }
    })

    const performanceMetrics = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      failed_tests: failedTests,
      pending_tests: pendingTests,
      success_rate: Math.round(successRate * 100) / 100,
      avg_duration_ms: Math.round(avgDuration),
      avg_response_size_kb: Math.round(avgSize),
      test_type_breakdown: testTypeBreakdown,
      time_period: '24h'
    }

    console.log('✅ Test results fetched:', {
      total: testResults?.length || 0,
      recent: totalTests,
      successRate: `${performanceMetrics.success_rate}%`
    })

    return NextResponse.json({
      success: true,
      results: testResults || [],
      performance_metrics: performanceMetrics,
      count: testResults?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error fetching test results:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch test results',
        details: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        performance_metrics: {
          total_tests: 0,
          successful_tests: 0,
          failed_tests: 0,
          pending_tests: 0,
          success_rate: 0,
          avg_duration_ms: 0,
          avg_response_size_kb: 0,
          test_type_breakdown: [],
          time_period: '24h'
        },
        count: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      card_id,
      test_type,
      status,
      duration_ms = 0,
      response_size_kb = 0,
      error_message,
      test_url
    } = body

    console.log('📝 Creating test result:', { test_type, status, duration_ms })

    // Check if test_results table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('test_results')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.warn('⚠️ test_results table does not exist, skipping logging')
      return NextResponse.json({
        success: false,
        message: 'test_results table not found - run SQL script to create it',
        error: tableCheckError.message
      }, { status: 404 })
    }

    const { data: result, error } = await supabase
      .from('test_results')
      .insert({
        card_id,
        test_type,
        status,
        duration_ms,
        response_size_kb,
        error_message,
        test_url
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating test result:', error)
      throw error
    }

    console.log('✅ Test result created:', result.id)

    return NextResponse.json({
      success: true,
      result,
      message: 'Test result created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating test result:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create test result',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    console.log('🧹 Cleaning up test results older than', days, 'days')

    // Check if test_results table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('test_results')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.warn('⚠️ test_results table does not exist')
      return NextResponse.json({
        success: false,
        message: 'test_results table not found - nothing to clean up'
      }, { status: 404 })
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { error } = await supabase
      .from('test_results')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('❌ Error cleaning up test results:', error)
      throw error
    }

    console.log('✅ Test results cleanup completed')

    return NextResponse.json({
      success: true,
      message: `Cleaned up test results older than ${days} days`
    })

  } catch (error) {
    console.error('❌ Error cleaning up test results:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clean up test results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 