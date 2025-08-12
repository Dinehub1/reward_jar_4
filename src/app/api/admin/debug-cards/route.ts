import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    console.log('🔍 Testing stamp cards query...')
    
    // Test the exact query that's failing in dashboard-unified
    const stampCardsResult = await adminClient
      .from('stamp_cards')
      .select(`
        id,
        business_id,
        card_name,
        stamps_required,
        status,
        created_at,
        businesses(name),
        customer_cards(id)
      `)
      .order('created_at', { ascending: false })
    
    console.log('Stamp cards query result:', {
      data: stampCardsResult.data,
      error: stampCardsResult.error,
      count: stampCardsResult.data?.length
    })

    // Test simpler query without nested selects
    const simpleStampCardsResult = await adminClient
      .from('stamp_cards')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Simple stamp cards query result:', {
      data: simpleStampCardsResult.data,
      error: simpleStampCardsResult.error,
      count: simpleStampCardsResult.data?.length
    })

    // Test membership cards
    const membershipCardsResult = await adminClient
      .from('membership_cards')
      .select(`
        id,
        business_id,
        name,
        total_sessions,
        cost,
        status,
        created_at,
        businesses(name),
        customer_cards(id)
      `)
      .order('created_at', { ascending: false })

    console.log('Membership cards query result:', {
      data: membershipCardsResult.data,
      error: membershipCardsResult.error,
      count: membershipCardsResult.data?.length
    })

    return NextResponse.json({
      success: true,
      debug: {
        stampCardsWithJoins: {
          count: stampCardsResult.data?.length || 0,
          error: stampCardsResult.error,
          sample: stampCardsResult.data?.slice(0, 2)
        },
        stampCardsSimple: {
          count: simpleStampCardsResult.data?.length || 0,
          error: simpleStampCardsResult.error,
          sample: simpleStampCardsResult.data?.slice(0, 2)
        },
        membershipCardsWithJoins: {
          count: membershipCardsResult.data?.length || 0,
          error: membershipCardsResult.error,
          sample: membershipCardsResult.data?.slice(0, 2)
        }
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}