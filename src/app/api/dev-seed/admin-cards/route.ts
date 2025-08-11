import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * POST /api/dev-seed/admin-cards
 * 
 * Creates test customer cards for development and testing purposes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardId, cardType, testCustomerId, currentStamps, sessionsUsed, walletType = 'pwa' } = body

      cardId,
      cardType,
      testCustomerId,
      currentStamps,
      sessionsUsed,
      walletType
    })

    const supabase = createAdminClient()

    // First, check if we need to create a test customer (must be valid UUIDs per schema)
    let customerId = testCustomerId
    const fallbackCustomerId = '00000000-0000-0000-0000-0000000000aa'
    const fallbackUserId = '00000000-0000-0000-0000-0000000000ab'
    if (!customerId) {
      // Ensure a valid user and customer exist
      await supabase.from('users').upsert({ id: fallbackUserId, email: 'test@sandbox.local', role_id: 3 })
      const { data: customerData } = await supabase
        .from('customers')
        .upsert({ id: fallbackCustomerId, user_id: fallbackUserId, name: 'Test User', email: 'test@sandbox.local' }, { onConflict: 'id' })
        .select()
        .single()
      customerId = customerData?.id || fallbackCustomerId
    }

    // Create customer card
    const customerCardData: any = {
      customer_id: customerId,
      wallet_type: walletType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (cardType === 'stamp') {
      customerCardData.stamp_card_id = cardId
      customerCardData.membership_card_id = null
      customerCardData.current_stamps = currentStamps || 0
      customerCardData.sessions_used = null
    } else if (cardType === 'membership') {
      customerCardData.stamp_card_id = null
      customerCardData.membership_card_id = cardId
      customerCardData.sessions_used = sessionsUsed || 0
      customerCardData.current_stamps = null
      customerCardData.expiry_date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
    }

    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .insert(customerCardData)
      .select(`
        *,
        customers(id, email),
        stamp_cards(id, name, total_stamps),
        membership_cards(id, name, total_sessions)
      `)
      .single()

    if (cardError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create test customer card', details: cardError.message },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      data: {
        customerCard,
        testData: {
          customerId,
          cardId,
          cardType,
          walletType,
          currentStamps: customerCardData.current_stamps,
          sessionsUsed: customerCardData.sessions_used,
          expiryDate: customerCardData.expiry_date
        }
      },
      message: 'Test customer card created successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dev-seed/admin-cards
 * 
 * Lists recent test customer cards for development purposes
 */
export async function GET() {
  try {

    const supabase = createAdminClient()

    const { data: testCards, error } = await supabase
      .from('customer_cards')
      .select(`
        *,
        customers(id, email),
        stamp_cards(id, name, total_stamps, businesses(name)),
        membership_cards(id, name, total_sessions, businesses(name))
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch test cards' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: testCards,
      count: testCards?.length || 0,
      message: 'Test customer cards retrieved successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}