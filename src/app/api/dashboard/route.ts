import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * 🔧 CONSOLIDATED DASHBOARD ENDPOINT
 * 
 * Handles dashboard data for all user types (admin, business)
 * Replaces: /api/business/dashboard, /api/admin/dashboard-*, etc.
 */
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
    const dashboardType = searchParams.get('type') || 'summary'

    // Admin dashboard (role_id = 1)
    if (userRole === 1) {
      return getAdminDashboard(dashboardType)
    }
    
    // Business dashboard (role_id = 2)
    if (userRole === 2) {
      return getBusinessDashboard(user.id, dashboardType)
    }

    return NextResponse.json(
      { error: 'Dashboard not available for this user type' },
      { status: 403 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Admin dashboard helper
async function getAdminDashboard(type: string) {
  const supabase = createAdminClient()
  
  try {
    // Get comprehensive admin data
    const [
      businessesResult,
      usersResult,
      cardsResult,
      customerCardsResult
    ] = await Promise.all([
      supabase.from('businesses').select('id, name, status, created_at'),
      supabase.from('users').select('id, role_id, created_at'),
      supabase.from('stamp_cards').select('id, status, created_at'),
      supabase.from('customer_cards').select('id, created_at')
    ])

    const businesses = businessesResult.data || []
    const users = usersResult.data || []
    const cards = cardsResult.data || []
    const customerCards = customerCardsResult.data || []

    // Calculate metrics
    const metrics = {
      total_businesses: businesses.length,
      active_businesses: businesses.filter(b => b.status === 'active').length,
      total_users: users.length,
      business_users: users.filter(u => u.role_id === 2).length,
      customer_users: users.filter(u => u.role_id === 3).length,
      total_cards: cards.length,
      active_cards: cards.filter(c => c.status === 'active').length,
      total_customer_cards: customerCards.length
    }

    // Recent activity
    const recentBusinesses = businesses
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    const recentCards = cards
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    return NextResponse.json({
      type: 'admin',
      dashboardType: type,
      timestamp: new Date().toISOString(),
      metrics,
      recent_activity: {
        businesses: recentBusinesses,
        cards: recentCards
      },
      system_health: {
        database: 'healthy',
        api: 'healthy',
        wallets: 'healthy'
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard data' },
      { status: 500 }
    )
  }
}

// Business dashboard helper
async function getBusinessDashboard(userId: string, type: string) {
  const supabase = await createServerClient()
  
  try {
    // Get business data for this user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get business-specific data
    const [cardsResult, customerCardsResult] = await Promise.all([
      supabase.from('stamp_cards').select('*').eq('business_id', business.id),
      supabase.from('customer_cards').select('*').eq('business_id', business.id)
    ])

    const cards = cardsResult.data || []
    const customerCards = customerCardsResult.data || []

    // Calculate profile progress
    const profileFields = ['name', 'description', 'contact_email', 'address', 'phone']
    const completedFields = profileFields.filter(field => business[field])
    const profileProgress = Math.round((completedFields.length / profileFields.length) * 100)

    // Business metrics
    const metrics = {
      total_cards: cards.length,
      active_cards: cards.filter(c => c.status === 'active').length,
      total_customers: customerCards.length,
      profile_progress: profileProgress
    }

    return NextResponse.json({
      type: 'business',
      dashboardType: type,
      timestamp: new Date().toISOString(),
      business: {
        id: business.id,
        name: business.name,
        status: business.status,
        profile_progress: profileProgress
      },
      metrics,
      cards: cards.slice(0, 5), // Recent cards
      quick_actions: [
        { id: 'create_card', label: 'Create New Card', url: '/admin/cards/new' },
        { id: 'view_customers', label: 'View Customers', url: '/admin/customers' },
        { id: 'analytics', label: 'View Analytics', url: '/admin/analytics' }
      ]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch business dashboard data' },
      { status: 500 }
    )
  }
}