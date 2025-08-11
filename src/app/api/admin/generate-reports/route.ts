import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  try {
    
    const supabase = createAdminClient()
    
    // Generate system metrics report
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

    const report = {
      generated_at: new Date().toISOString(),
      system_metrics: {
        total_businesses: totalBusinesses || 0,
        total_customers: totalCustomers || 0,
        total_cards: totalCards || 0,
        total_stamp_cards: totalStampCards || 0,
        total_membership_cards: totalMembershipCards || 0
      },
      summary: {
        platform_health: 'Healthy',
        active_users: totalCustomers || 0,
        card_utilization: totalCards ? ((totalCards / ((totalStampCards || 0) + (totalMembershipCards || 0))) * 100).toFixed(1) + '%' : '0%'
      }
    }

    // Log report generation to admin logs (skipped - requires valid admin user ID)


    return NextResponse.json({
      success: true,
      message: 'Reports generated successfully',
      report,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error during report generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}