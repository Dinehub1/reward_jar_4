import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== BUSINESS DASHBOARD API START ===')
    
    const supabase = await createServerClient()
    
    // Check authentication using centralized helper
    const { user, error: userError } = await getServerUser()
    
    if (userError || !user) {
      console.error('Dashboard API: Authentication failed:', userError?.message)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('Dashboard API: User authenticated:', user.id)

    // Check if user has business role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (roleError || !userData) {
      console.error('Dashboard API: Role check failed:', roleError?.message)
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 403 }
      )
    }

    if (userData.role_id !== 2) {
      console.error('Dashboard API: User is not a business user:', userData.role_id)
      return NextResponse.json(
        { error: 'Business access required' },
        { status: 403 }
      )
    }

    console.log('Dashboard API: Business user verified')

    // Get business data
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (businessError) {
      console.error('Dashboard API: Business fetch failed:', businessError.message)
      return NextResponse.json(
        { error: 'Failed to fetch business data' },
        { status: 500 }
      )
    }

    // Calculate profile progress
    const profileProgress = calculateProfileProgress(businessData)

    // Get quick stats
    const [stampsResult, cardsResult, customersResult] = await Promise.all([
      supabase
        .from('stamp_cards')
        .select('id', { count: 'exact' })
        .eq('business_id', businessData.id),
      
      supabase
        .from('customer_cards')
        .select('id', { count: 'exact' })
        .eq('business_id', businessData.id),
      
      supabase
        .from('customers')
        .select('id', { count: 'exact' })
    ])

    const quickStats = {
      total_cards: (stampsResult.count || 0),
      total_customers: (customersResult.count || 0),
      total_revenue: 0, // TODO: Calculate from transactions
      recent_activity: 5 // TODO: Get actual recent activity count
    }

    // Get recent cards (simplified for now)
    const { data: recentCards } = await supabase
      .from('stamp_cards')
      .select('id, name, created_at')
      .eq('business_id', businessData.id)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('Dashboard API: Data fetch successful')

    const response = {
      profile_progress: profileProgress,
      subscription_status: {
        status: 'active',
        plan: 'business',
        next_billing: null
      },
      customer_highlights: {
        new_customers: 0, // TODO: Calculate actual metrics
        repeat_visits: 0,
        revenue_impact: 0
      },
      quick_stats: quickStats,
      recent_cards: recentCards || []
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300' // 5 minutes cache
      }
    })

  } catch (error) {
    console.error('Dashboard API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateProfileProgress(business: any): number {
  let progress = 20 // Base progress for having an account
  
  if (business.name && business.name.trim()) progress += 20
  if (business.description && business.description.trim()) progress += 15
  if (business.contact_email && business.contact_email.trim()) progress += 15
  // Add more fields as needed
  
  return Math.min(progress, 100)
} 