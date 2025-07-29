import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  console.log('🎯 ADMIN PANEL DATA - Fetching all data for admin panel...')
  
  try {
    const supabase = createAdminClient()
    
    // 1. Get system metrics by fetching data and counting
    const [
      businessesData,
      customersData,
      customerCardsData,
      stampCardsData,
      membershipCardsData,
      flaggedBusinessesData
    ] = await Promise.all([
      supabase.from('businesses').select('id'),
      supabase.from('customers').select('id'),
      supabase.from('customer_cards').select('id'),
      supabase.from('stamp_cards').select('id'),
      supabase.from('membership_cards').select('id'),
      supabase.from('businesses').select('id').eq('is_flagged', true)
    ])

    // Count results with proper error handling
    const totalBusinesses = businessesData.data?.length || 0
    const totalCustomers = customersData.data?.length || 0
    const totalCustomerCards = customerCardsData.data?.length || 0
    const totalStampCards = stampCardsData.data?.length || 0
    const totalMembershipCards = membershipCardsData.data?.length || 0
    const flaggedBusinesses = flaggedBusinessesData.data?.length || 0

    console.log('📊 ADMIN PANEL DATA - Metrics:', {
      totalBusinesses,
      totalCustomers,
      totalCustomerCards,
      totalStampCards,
      totalMembershipCards,
      flaggedBusinesses
    })

    // 2. Get businesses with details (simplified to avoid join issues)
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        contact_email,
        description,
        status,
        is_flagged,
        admin_notes,
        created_at,
        owner_id
      `)
      .order('created_at', { ascending: false })

    console.log('🏢 ADMIN PANEL DATA - Businesses:', businesses?.length || 0)

    // 3. Get stamp cards with business info
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .select(`
        id,
        name,
        total_stamps,
        reward_description,
        status,
        created_at,
        business_id,
        businesses!inner(id, name)
      `)
      .order('created_at', { ascending: false })

    console.log('🎴 ADMIN PANEL DATA - Stamp cards:', stampCards?.length || 0)

    // 4. Get membership cards with business info
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .select(`
        id,
        name,
        total_sessions,
        cost,
        duration_days,
        status,
        created_at,
        business_id,
        businesses!inner(id, name)
      `)
      .order('created_at', { ascending: false })

    console.log('💳 ADMIN PANEL DATA - Membership cards:', membershipCards?.length || 0)

    // 5. Get customers with card info
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        created_at,
        customer_cards(
          id,
          current_stamps,
          sessions_used,
          stamp_card_id,
          membership_card_id,
          stamp_cards(name, businesses(name)),
          membership_cards(name, businesses(name))
        )
      `)
      .order('created_at', { ascending: false })

    console.log('👥 ADMIN PANEL DATA - Customers:', customers?.length || 0)

    // 6. Get recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        created_at,
        current_stamps,
        sessions_used,
        stamp_card_id,
        membership_card_id,
        customers!inner(name),
        stamp_cards(name, businesses(name)),
        membership_cards(name, businesses(name))
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('⚡ ADMIN PANEL DATA - Recent activity:', recentActivity?.length || 0)

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalBusinesses: totalBusinesses || 0,
        totalCustomers: totalCustomers || 0,
        totalCards: totalCustomerCards || 0, // Active customer cards
        totalStampCards: totalStampCards || 0,
        totalMembershipCards: totalMembershipCards || 0,
        flaggedBusinesses: flaggedBusinesses || 0
      },
      data: {
        businesses: businesses || [],
        stampCards: stampCards || [],
        membershipCards: membershipCards || [],
        customers: customers || [],
        recentActivity: recentActivity || []
      },
      errors: {
        business: businessError,
        stamp: stampError,
        membership: membershipError,
        customer: customerError,
        activity: activityError
      }
    }

    console.log('✅ ADMIN PANEL DATA - Response prepared with', {
      businessCount: response.data.businesses.length,
      stampCardCount: response.data.stampCards.length,
      membershipCardCount: response.data.membershipCards.length,
      customerCount: response.data.customers.length,
      activityCount: response.data.recentActivity.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 ADMIN PANEL DATA - Error:', error)
    return NextResponse.json({ 
      error: 'Admin panel data fetch failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 