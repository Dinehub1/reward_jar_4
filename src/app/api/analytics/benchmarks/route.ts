import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'
import { industryBenchmarking } from '@/lib/analytics/industry-benchmarking'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * 🏆 INDUSTRY BENCHMARKING API
 * 
 * Provides competitive analytics and industry comparisons
 * Key differentiator for subscription revenue
 */

interface BenchmarkRequest {
  businessId?: string
  industry?: string
  size?: 'small' | 'medium' | 'large'
  timeRange?: '7d' | '30d' | '90d'
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (roleError || !userData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to verify user role',
          code: 'ROLE_VERIFICATION_FAILED'
        } as ApiResponse<never>,
        { status: 403 }
      )
    }

    const userRole = userData.role_id
    
    // Get request parameters
    const businessId = searchParams.get('businessId')
    const industry = searchParams.get('industry')
    const size = searchParams.get('size') as 'small' | 'medium' | 'large'
    const timeRange = searchParams.get('timeRange') || '30d'

    let benchmarkData

    if (userRole === 1) {
      // Admin can access any business benchmarks
      if (businessId) {
        benchmarkData = await industryBenchmarking.getBusinessBenchmarks(businessId)
      } else {
        // Return industry overview
        benchmarkData = await industryBenchmarking.calculateIndustryBenchmarks(
          industry as any || 'restaurant',
          size || 'medium'
        )
      }
    } else if (userRole === 2) {
      // Business user can only access their own benchmarks
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (businessError || !business) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Business not found for user',
            code: 'BUSINESS_NOT_FOUND'
          } as ApiResponse<never>,
          { status: 404 }
        )
      }

      benchmarkData = await industryBenchmarking.getBusinessBenchmarks(business.id)
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        } as ApiResponse<never>,
        { status: 403 }
      )
    }

    const responseTime = Date.now() - startTime

    // Add usage analytics for premium feature tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'benchmarks_accessed', {
        user_role: userRole,
        business_id: businessId,
        response_time: responseTime
      })
    }

    return NextResponse.json({
      success: true,
      data: benchmarkData,
      meta: {
        responseTime,
        timeRange,
        userRole,
        timestamp: new Date().toISOString(),
        cacheHint: 'public, max-age=3600' // Cache for 1 hour
      }
    } as ApiResponse<typeof benchmarkData>)

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('[BENCHMARKS-API] Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'BENCHMARKING_ERROR',
        meta: { responseTime }
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST - Update business metrics for benchmarking
 * Called periodically to refresh benchmark data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    
    // Verify admin access for data updates
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userData?.role_id !== 1) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { businessId, metrics } = body

    // Update business metrics
    const { error: updateError } = await supabase
      .from('business_metrics')
      .upsert({
        business_id: businessId,
        ...metrics,
        updated_at: new Date().toISOString()
      })

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: 'Benchmark data updated successfully'
    })

  } catch (error) {
    console.error('[BENCHMARKS-UPDATE] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update benchmark data' 
      },
      { status: 500 }
    )
  }
}