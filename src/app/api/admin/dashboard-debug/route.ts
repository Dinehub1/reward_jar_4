import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET() {
  console.log('🔍 DASHBOARD DEBUG - Starting admin client test...')
  
  const supabase = createAdminClient()
  
  try {
    // Test the exact same queries as the dashboard
    const [
      { count: totalBusinesses },
      { count: totalCustomers },
      { count: totalCustomerCards },
      { count: totalStampCards },
      { count: totalMembershipCards },
      { count: flaggedBusinesses },
      { count: recentActivity }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customer_cards').select('*', { count: 'exact', head: true }),
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
      supabase.from('session_usage').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    console.log('📊 DASHBOARD DEBUG - Raw counts:', {
      totalBusinesses,
      totalCustomers,
      totalCustomerCards,
      totalStampCards,
      totalMembershipCards,
      flaggedBusinesses,
      recentActivity
    })

    // Get sample businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at')
      .limit(5)

    console.log('🏢 DASHBOARD DEBUG - Sample businesses:', businesses?.length || 0)

    const dashboardData = {
      metrics: {
        totalBusinesses: totalBusinesses || 0,
        totalCustomers: totalCustomers || 0,
        totalCards: totalCustomerCards || 0,
        totalStampCards: totalStampCards || 0,
        totalMembershipCards: totalMembershipCards || 0,
        flaggedBusinesses: flaggedBusinesses || 0,
        recentActivity: recentActivity || 0
      },
      sampleBusinesses: businesses || [],
      timestamp: new Date().toISOString(),
      success: true
    }

    console.log('✅ DASHBOARD DEBUG - Final data structure:', dashboardData)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('💥 DASHBOARD DEBUG - Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 