import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema
const joinCardSchema = z.object({
  stampCardId: z.string().uuid('Invalid stamp card ID'),
  walletType: z.enum(['apple', 'google', 'pwa']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = joinCardSchema.parse(body)
    
    const { stampCardId, walletType: requestedWalletType } = validatedData

    // Check if user is a customer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData || userData.role_id !== 3) {
      return NextResponse.json(
        { error: 'Only customers can join stamp cards' },
        { status: 403 }
      )
    }

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      )
    }

    // Verify stamp card exists and is active
    const { data: stampCard, error: cardError } = await supabase
      .from('stamp_cards')
      .select('id, business_id, name, total_stamps, reward_description')
      .eq('id', stampCardId)
      .eq('status', 'active')
      .single()

    if (cardError || !stampCard) {
      return NextResponse.json(
        { error: 'Stamp card not found or inactive' },
        { status: 404 }
      )
    }

    // Use requested wallet type or default to PWA
    const walletType = requestedWalletType || 'pwa'

    // Check if customer has already joined this card
    const { data: existingCard } = await supabase
      .from('customer_cards')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('stamp_card_id', stampCardId)
      .single()

    if (existingCard) {
      return NextResponse.json(
        { 
          error: 'Already joined this stamp card',
          customerCardId: existingCard.id 
        },
        { status: 409 }
      )
    }

    // Create customer card relationship
    const { data: customerCard, error: insertError } = await supabase
      .from('customer_cards')
      .insert({
        customer_id: customer.id,
        stamp_card_id: stampCardId,
        current_stamps: 0,
        wallet_type: walletType,
        wallet_pass_id: null // Will be generated when needed
      })
      .select()
      .single()

    if (insertError || !customerCard) {
      console.error('Error creating customer card:', insertError)
      return NextResponse.json(
        { error: 'Failed to join stamp card' },
        { status: 500 }
      )
    }

    // Generate wallet pass based on type
    let walletPassUrl = null
    try {
      const baseUrl = process.env.BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
      
      switch (walletType) {
        case 'apple':
          walletPassUrl = `${baseUrl}/api/wallet/apple/${customerCard.id}`
          break
        case 'google':
          walletPassUrl = `${baseUrl}/api/wallet/google/${customerCard.id}`
          break
        case 'pwa':
        default:
          walletPassUrl = `${baseUrl}/api/wallet/pwa/${customerCard.id}`
          break
      }
    } catch (walletError) {
      console.error('Error generating wallet pass:', walletError)
      // Continue without wallet pass - not critical for joining
    }

    return NextResponse.json({
      success: true,
      customerCardId: customerCard.id,
      stampCard: {
        id: stampCard.id,
        name: stampCard.name,
        totalStamps: stampCard.total_stamps,
        rewardDescription: stampCard.reward_description
      },
      currentStamps: 0,
      walletType,
      walletPassUrl,
      message: 'Successfully joined stamp card!'
    })

  } catch (error) {
    console.error('Error in join card API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 