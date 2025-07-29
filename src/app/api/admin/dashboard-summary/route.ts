import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  console.log('📊 DASHBOARD SUMMARY - Generating comprehensive admin dashboard data...')
  
  try {
    const supabase = createAdminClient()
    
    // Get all the metrics the admin dashboard needs
    const [
      { count: totalBusinesses },
      { count: totalCustomers },
      { count: totalCustomerCards },
      { count: totalStampCards },
      { count: totalMembershipCards },
      { count: flaggedBusinesses }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customer_cards').select('*', { count: 'exact', head: true }),
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_flagged', true)
    ])

    // Get business samples
    const { data: businessSamples } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get stamp card samples  
    const { data: stampCardSamples } = await supabase
      .from('stamp_cards')
      .select('id, name, total_stamps, businesses(name)')
      .limit(5)

    // Get membership card samples
    const { data: membershipCardSamples } = await supabase
      .from('membership_cards')
      .select('id, name, total_sessions, businesses(name)')
      .limit(5)

    // Get customer card samples
    const { data: customerCardSamples } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        customers(name),
        stamp_cards(name, businesses(name))
      `)
      .limit(5)

    const summary = {
      metrics: {
        totalBusinesses: totalBusinesses || 0,
        totalCustomers: totalCustomers || 0,
        totalActiveCards: totalCustomerCards || 0,
        totalStampCards: totalStampCards || 0,
        totalMembershipCards: totalMembershipCards || 0,
        flaggedBusinesses: flaggedBusinesses || 0
      },
      samples: {
        businesses: businessSamples || [],
        stampCards: stampCardSamples || [],
        membershipCards: membershipCardSamples || [],
        customerCards: customerCardSamples || []
      },
      expectedDisplay: {
        dashboardCards: [
          {
            title: "Total Businesses",
            value: totalBusinesses || 0,
            description: "Active businesses",
            expected: "Should show 11 (not 1)"
          },
          {
            title: "Total Customers", 
            value: totalCustomers || 0,
            description: "Registered users",
            expected: "Should show 1 (not 0)"
          },
          {
            title: "Active Cards",
            value: totalCustomerCards || 0,
            description: "Customer cards",
            expected: "Should show 5 (not 0)"
          }
        ]
      }
    }

    console.log('✅ DASHBOARD SUMMARY - Generated summary:', {
      businessCount: summary.metrics.totalBusinesses,
      customerCount: summary.metrics.totalCustomers,
      cardCount: summary.metrics.totalActiveCards,
      businessSampleCount: summary.samples.businesses.length
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary
    })

  } catch (error) {
    console.error('💥 DASHBOARD SUMMARY - Error:', error)
    return NextResponse.json({ 
      error: 'Dashboard summary failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 