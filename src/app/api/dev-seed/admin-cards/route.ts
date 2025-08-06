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

    console.log('🌱 DEV SEED - Creating test customer card:', {
      cardId,
      cardType,
      testCustomerId,
      currentStamps,
      sessionsUsed,
      walletType
    })

    const supabase = createAdminClient()

    // First, check if we need to create a test customer
    let customerId = testCustomerId
    if (!customerId || customerId.startsWith('test-customer-')) {
      // Create a test customer
      const testCustomer = {
        id: testCustomerId || `test-customer-${Date.now()}`,
        email: `test-${Date.now()}@sandbox.local`,
        role_id: 3, // Customer role
        created_at: new Date().toISOString()
      }

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .upsert(testCustomer, { onConflict: 'id' })
        .select()
        .single()

      if (customerError) {
        console.error('💥 DEV SEED - Error creating test customer:', customerError)
        // Try to continue with existing customer if upsert failed
        customerId = testCustomer.id
      } else {
        customerId = customerData.id
      }
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
      customerCardData.current_stamps = currentStamps || 0
    } else if (cardType === 'membership') {
      customerCardData.membership_card_id = cardId
      customerCardData.sessions_used = sessionsUsed || 0
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
      console.error('💥 DEV SEED - Error creating customer card:', cardError)
      return NextResponse.json(
        { success: false, error: 'Failed to create test customer card', details: cardError.message },
        { status: 500 }
      )
    }

    console.log('✅ DEV SEED - Test customer card created successfully:', customerCard.id)

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
    console.error('💥 DEV SEED - Unexpected error:', error)
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
    console.log('🌱 DEV SEED - Fetching recent test customer cards')

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
      console.error('💥 DEV SEED - Error fetching test cards:', error)
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
    console.error('💥 DEV SEED - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}