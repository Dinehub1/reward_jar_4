import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, dateOfBirth, cardId, cardType } = body

    // Validate input
    if (!name?.trim() || !email?.trim() || !cardId || !cardType) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, card ID, and card type are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid email address'
      }, { status: 400 })
    }

    // Use admin client to bypass RLS for guest registration
    const supabase = createAdminClient()

    // Verify the card exists and is active
    const cardTable = cardType === 'stamp' ? 'stamp_cards' : 'membership_cards'
    const { data: cardInfo, error: cardError } = await supabase
      .from(cardTable)
      .select('id, name, business_id, ' + (cardType === 'stamp' ? 'card_expiry_days' : 'duration_days'))
      .eq('id', cardId)
      .eq('status', 'active')
      .single()

    if (cardError || !cardInfo) {
      return NextResponse.json({
        success: false,
        error: 'Card not found or is no longer active'
      }, { status: 404 })
    }

    // Type guard to ensure cardInfo has the expected properties
    if (!('name' in cardInfo) || !('id' in cardInfo)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid card data'
      }, { status: 500 })
    }

    // Ensure duration_days exists for membership cards
    if (cardType === 'membership' && !('duration_days' in cardInfo)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid membership card data'
      }, { status: 500 })
    }

    // Check if customer already exists by email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.trim())
      .single()

    let customerId = existingCustomer?.id

    if (!customerId) {
      // Create new guest customer using the special guest user ID
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          user_id: '00000000-0000-0000-0000-000000000000', // Special guest user ID
          name: name.trim(),
          email: email.trim()
        }])
        .select('id')
        .single()
      
      if (customerError) {
        console.error('Customer creation failed:', customerError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create customer account. Please try again.'
        }, { status: 500 })
      }
      
      customerId = newCustomer.id
    }

    // Check if customer already has this card
    const { data: existingCard } = await supabase
      .from('customer_cards')
      .select('id')
      .eq('customer_id', customerId)
      .eq(cardType === 'stamp' ? 'stamp_card_id' : 'membership_card_id', cardId)
      .single()

    if (existingCard) {
      return NextResponse.json({
        success: true,
        message: 'Welcome back! You already have this card.',
        data: {
          customerCardId: existingCard.id,
          customerId: customerId,
          cardName: cardInfo.name,
          isExisting: true
        }
      }, { status: 200 })
    }

    // Create customer card
    const customerCardData = {
      customer_id: customerId,
      ...(cardType === 'stamp' ? {
        stamp_card_id: cardId,
        membership_card_id: null,
        current_stamps: 0
      } : {
        stamp_card_id: null,
        membership_card_id: cardId,
        sessions_used: 0,
        expiry_date: new Date(Date.now() + ((cardInfo as any).duration_days || 365) * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    const { data: newCustomerCard, error: cardCreateError } = await supabase
      .from('customer_cards')
      .insert([customerCardData])
      .select('id')
      .single()

    if (cardCreateError) {
      console.error('Customer card creation failed:', cardCreateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to register for card. Please try again.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for card!',
      data: {
        customerCardId: newCustomerCard.id,
        customerId: customerId,
        cardName: cardInfo.name
      }
    })

  } catch (error) {
    console.error('Card join error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process registration. Please try again.'
    }, { status: 500 })
  }
}