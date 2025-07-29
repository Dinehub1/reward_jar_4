import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET() {
  console.log('🔍 UI TEST - Starting admin dashboard UI verification...')
  
  const supabase = createAdminClient()
  
  try {
    // Get the exact same data as the admin dashboard
    const [
      { count: totalBusinesses },
      { count: totalCustomers },
      { count: totalCards },
      { count: totalStampCards },
      { count: totalMembershipCards }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customer_cards').select('*', { count: 'exact', head: true }),
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true })
    ])

    // Get recent businesses
    const { data: recentBusinesses } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const dashboardData = {
      metrics: {
        totalBusinesses: totalBusinesses || 0,
        totalCustomers: totalCustomers || 0,
        totalCards: totalCards || 0,
        totalStampCards: totalStampCards || 0,
        totalMembershipCards: totalMembershipCards || 0,
        totalTemplates: (totalStampCards || 0) + (totalMembershipCards || 0)
      },
      recentBusinesses: recentBusinesses || [],
      uiShouldShow: {
        businessCard: `${totalBusinesses || 0} businesses`,
        customerCard: `${totalCustomers || 0} customers`,
        activeCardsCard: `${totalCards || 0} active cards`,
        templatesCard: `${(totalStampCards || 0) + (totalMembershipCards || 0)} templates (${totalStampCards || 0} stamp + ${totalMembershipCards || 0} membership)`,
        recentBusinessesList: recentBusinesses?.map(b => `${b.name} (${b.contact_email})`) || []
      },
      status: 'success',
      timestamp: new Date().toISOString()
    }

    console.log('✅ UI TEST - Dashboard data prepared:', dashboardData)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('💥 UI TEST - Error:', error)
    return NextResponse.json({
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 