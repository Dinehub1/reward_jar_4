import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-only'

export async function GET(request: NextRequest) {
  console.log('📊 DASHBOARD METRICS - Starting data fetch...')
  
  try {
    const supabase = await createClient()
    
    console.log('🔍 DASHBOARD METRICS - Supabase client created')
    
    // Get comprehensive system metrics (exactly like admin dashboard)
    const [
      { count: totalBusinesses },
      { count: totalCustomers },
      { count: totalCards },
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

    console.log('📈 DASHBOARD METRICS - Counts fetched:', {
      totalBusinesses,
      totalCustomers,
      totalCards,
      totalStampCards,
      totalMembershipCards,
      flaggedBusinesses,
      recentActivity
    })

    // Get recent businesses (last 7 days)
    const { data: recentBusinesses, error: businessError } = await supabase
      .from('businesses')
      .select('name, created_at, contact_email')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('🏢 DASHBOARD METRICS - Recent businesses:', recentBusinesses?.length || 0)

    // Get recent customer activity
    const { data: recentCustomerActivity, error: activityError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        created_at,
        current_stamps,
        membership_type,
        customers!inner(name),
        stamp_cards!inner(name, businesses!inner(name))
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('👥 DASHBOARD METRICS - Recent activity:', recentCustomerActivity?.length || 0)

    // Get inactive businesses (older than 30 days)
    const { data: inactiveBusinesses, error: inactiveError } = await supabase
      .from('businesses')
      .select('id, name')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(5)

    console.log('⚠️ DASHBOARD METRICS - Inactive businesses:', inactiveBusinesses?.length || 0)

    const metrics = {
      totalBusinesses: totalBusinesses || 0,
      totalCustomers: totalCustomers || 0,
      totalCards: totalCards || 0,
      totalStampCards: totalStampCards || 0,
      totalMembershipCards: totalMembershipCards || 0,
      flaggedBusinesses: flaggedBusinesses || 0,
      recentActivity: recentActivity || 0,
      recentBusinesses: recentBusinesses || [],
      recentCustomerActivity: recentCustomerActivity || [],
      inactiveBusinesses: inactiveBusinesses || []
    }

    console.log('✅ DASHBOARD METRICS - Final metrics:', metrics)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
      errors: {
        business: businessError,
        activity: activityError,
        inactive: inactiveError
      }
    })

  } catch (error) {
    console.error('💥 DASHBOARD METRICS - Error:', error)
    return NextResponse.json({ 
      error: 'Dashboard metrics failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 