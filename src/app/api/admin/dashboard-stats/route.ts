import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * GET /api/admin/dashboard-stats
 * 
 * Fetches admin dashboard statistics
 * Used by the admin dashboard to display key metrics
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('📊 ADMIN DASHBOARD STATS - Fetching statistics...')
    
    const supabase = createAdminClient()
    
    // Fetch all statistics in parallel for better performance
    const [
      businessesResult,
      customersResult,
      customerCardsResult,
      stampCardsResult,
      membershipCardsResult,
      flaggedBusinessesResult
    ] = await Promise.all([
      supabase.from('businesses').select('id', { count: 'exact' }),
      supabase.from('customers').select('id', { count: 'exact' }),
      supabase.from('customer_cards').select('id', { count: 'exact' }),
      supabase.from('stamp_cards').select('id', { count: 'exact' }),
      supabase.from('membership_cards').select('id', { count: 'exact' }),
      supabase.from('businesses').select('id', { count: 'exact' }).eq('is_flagged', true)
    ])

    // Check for errors
    const errors = [
      businessesResult.error,
      customersResult.error,
      customerCardsResult.error,
      stampCardsResult.error,
      membershipCardsResult.error,
      flaggedBusinessesResult.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('❌ ADMIN DASHBOARD STATS - Database errors:', errors)
      throw new Error(`Database query failed: ${errors[0]?.message}`)
    }

    // Calculate statistics
    const stats = {
      totalBusinesses: businessesResult.count || 0,
      totalCustomers: customersResult.count || 0,
      totalCards: customerCardsResult.count || 0,
      totalStampCards: stampCardsResult.count || 0,
      totalMembershipCards: membershipCardsResult.count || 0,
      flaggedBusinesses: flaggedBusinessesResult.count || 0,
      recentActivity: customerCardsResult.count || 0 // Using customer cards as activity metric
    }

    console.log('✅ ADMIN DASHBOARD STATS - Statistics calculated:', stats)

    return NextResponse.json({
      success: true,
      data: {
        stats
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ ADMIN DASHBOARD STATS - Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}