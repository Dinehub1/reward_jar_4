import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * 🔧 CONSOLIDATED ANALYTICS ENDPOINT
 * 
 * Handles analytics for all user types (admin, business, customer)
 * Replaces: /api/analytics, /api/admin/analytics, /api/business/analytics
 */

// POST - Log analytics events
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { event, properties, user_id, session_id } = body
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      )
    }

    // Log analytics event
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([{
        event_name: event,
        properties: properties || {},
        user_id: user_id || null,
        session_id: session_id || null,
        timestamp: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      }])
      .select()
      .single()

    if (error) {
      console.error('Analytics logging error:', error)
      return NextResponse.json(
        { error: 'Failed to log analytics event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, event_id: data.id })

  } catch (error) {
    console.error('Analytics POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve analytics data (role-based)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Failed to verify user role' },
        { status: 403 }
      )
    }

    const userRole = userData.role_id
    const timeRange = searchParams.get('timeRange') || '30d'
    const eventType = searchParams.get('eventType') || 'all'

    // Admin analytics (role_id = 1)
    if (userRole === 1) {
      return getAdminAnalytics(timeRange, eventType)
    }
    
    // Business analytics (role_id = 2)
    if (userRole === 2) {
      return getBusinessAnalytics(user.id, timeRange, eventType)
    }
    
    // Customer analytics (role_id = 3) - limited
    if (userRole === 3) {
      return getCustomerAnalytics(user.id, timeRange)
    }

    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 403 }
    )

  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Admin analytics helper
async function getAdminAnalytics(timeRange: string, eventType: string) {
  const supabase = createAdminClient()
  
  try {
    // Get system-wide analytics
    const [
      totalUsers,
      totalBusinesses,
      totalCards,
      totalEvents
    ] = await Promise.all([
      supabase.from('users').select('count'),
      supabase.from('businesses').select('count'),
      supabase.from('stamp_cards').select('count'),
      supabase.from('analytics_events').select('count')
    ])

    return NextResponse.json({
      type: 'admin',
      timeRange,
      summary: {
        total_users: totalUsers.count || 0,
        total_businesses: totalBusinesses.count || 0,
        total_cards: totalCards.count || 0,
        total_events: totalEvents.count || 0
      },
      platform_health: 'operational',
      user_growth: {
        current_period: totalUsers.count || 0,
        previous_period: 0,
        growth_rate: 0
      }
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin analytics' },
      { status: 500 }
    )
  }
}

// Business analytics helper using MCP
async function getBusinessAnalytics(userId: string, timeRange: string, eventType: string) {
  try {
    // Get auth context using MCP
    const { getAuthContext } = await import('@/mcp/auth')
    const authResult = await getAuthContext()
    
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authContext = authResult.data
    
    // Verify this is a business user
    if (authContext.userRole !== 2 || !authContext.businessId) {
      return NextResponse.json(
        { error: 'Business access required' },
        { status: 403 }
      )
    }

    // Get business analytics using MCP
    const { getBusinessStats } = await import('@/mcp/analytics')
    const statsResult = await getBusinessStats(authContext)
    
    if (!statsResult.success) {
      return NextResponse.json(
        { error: statsResult.error || 'Failed to fetch business statistics' },
        { status: 500 }
      )
    }

    // Get business details using MCP
    const { getBusinessById } = await import('@/mcp/businesses')
    const businessResult = await getBusinessById(authContext.businessId)
    
    if (!businessResult.success) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const business = businessResult.data
    const stats = statsResult.data

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      type: 'business',
      business_id: business.id,
      business_name: business.name,
      timeRange,
      summary: {
        total_cards: (stats.totalStampCards || 0) + (stats.totalMembershipCards || 0),
        total_customers: stats.activeCustomerCards || 0,
        revenue: 0, // Placeholder - would need transaction data
        engagement_rate: stats.recentCustomerCards || 0
      }
    })
  } catch (error) {
    console.error('Business analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business analytics' },
      { status: 500 }
    )
  }
}

// Customer analytics helper
async function getCustomerAnalytics(userId: string, timeRange: string) {
  const supabase = await createServerClient()
  
  try {
    // Get customer's own analytics only
    const { data: customerCards, error } = await supabase
      .from('customer_cards')
      .select('count')
      .eq('customer_id', userId)

    return NextResponse.json({
      type: 'customer',
      timeRange,
      summary: {
        my_cards: customerCards?.length || 0,
        rewards_earned: 0, // Placeholder
        stamps_collected: 0 // Placeholder
      }
    })
  } catch (error) {
    console.error('Customer analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    )
  }
}