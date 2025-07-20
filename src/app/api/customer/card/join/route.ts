import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema - supports both stamp cards and membership cards
const joinCardSchema = z.object({
  stampCardId: z.string().uuid('Invalid stamp card ID').optional(),
  membershipCardId: z.string().uuid('Invalid membership card ID').optional(),
  walletType: z.enum(['apple', 'google', 'pwa']).optional()
}).refine(
  (data) => data.stampCardId || data.membershipCardId,
  {
    message: "Either stampCardId or membershipCardId must be provided",
    path: ["cardId"]
  }
)

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
    
    const { stampCardId, membershipCardId, walletType } = validatedData
    const isLoyaltyCard = !!stampCardId
    const isMembershipCard = !!membershipCardId
    const cardId = stampCardId || membershipCardId

    // Check if user is a customer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData || userData.role_id !== 3) {
      return NextResponse.json(
        { error: 'Only customers can join cards' },
        { status: 403 }
      )
    }

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', session.user.id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      )
    }

    let cardData: any = null
    let businessData: any = null

    if (isLoyaltyCard) {
      // Handle loyalty stamp card
    const { data: stampCard, error: cardError } = await supabase
      .from('stamp_cards')
        .select(`
          id, 
          business_id, 
          name, 
          total_stamps, 
          reward_description,
          businesses!inner (
            id,
            name,
            description
          )
        `)
        .eq('id', cardId)
      .eq('status', 'active')
      .single()

    if (cardError || !stampCard) {
      return NextResponse.json(
        { error: 'Stamp card not found or inactive' },
        { status: 404 }
      )
    }

      cardData = stampCard
      businessData = Array.isArray(stampCard.businesses) ? stampCard.businesses[0] : stampCard.businesses

      // Check if customer has already joined this stamp card
    const { data: existingCard } = await supabase
      .from('customer_cards')
      .select('id')
      .eq('customer_id', customer.id)
        .eq('stamp_card_id', cardId)
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

    } else if (isMembershipCard) {
      // Handle membership card
      const { data: membershipCard, error: cardError } = await supabase
        .from('membership_cards')
        .select(`
          id,
          business_id,
          name,
          total_sessions,
          cost,
          duration_days,
          businesses!inner (
            id,
            name,
            description
          )
        `)
        .eq('id', cardId)
        .eq('status', 'active')
        .single()

      if (cardError || !membershipCard) {
        return NextResponse.json(
          { error: 'Membership card not found or inactive' },
          { status: 404 }
        )
      }

      cardData = membershipCard
      businessData = Array.isArray(membershipCard.businesses) ? membershipCard.businesses[0] : membershipCard.businesses

      // Check if customer has already joined this membership
      const { data: existingCard } = await supabase
        .from('customer_cards')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('stamp_card_id', cardId) // Using stamp_card_id for both types for simplicity
        .eq('membership_type', 'gym')
        .single()

      if (existingCard) {
        return NextResponse.json(
          { 
            error: 'Already joined this membership',
            customerCardId: existingCard.id 
          },
          { status: 409 }
        )
      }
    }

    if (!cardData || !businessData) {
      return NextResponse.json(
        { error: 'Card or business data not found' },
        { status: 404 }
      )
    }

    // Calculate expiry date for memberships
    let expiryDate = null
    if (isMembershipCard) {
      const durationDays = cardData.duration_days || 365
      expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + durationDays)
    }

    // Create customer card relationship with type-specific data
    const customerCardData = {
      customer_id: customer.id,
      stamp_card_id: cardId, // Using for both types
      current_stamps: isLoyaltyCard ? 0 : undefined,
      membership_type: isLoyaltyCard ? 'loyalty' : 'gym',
      total_sessions: isMembershipCard ? cardData.total_sessions : undefined,
      sessions_used: isMembershipCard ? 0 : undefined,
      cost: isMembershipCard ? cardData.cost : undefined,
      expiry_date: expiryDate ? expiryDate.toISOString() : undefined,
      wallet_type: walletType || 'pwa',
      wallet_pass_id: null // Will be generated when needed
    }

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(customerCardData).filter(([_, value]) => value !== undefined)
    )

    const { data: customerCard, error: insertError } = await supabase
      .from('customer_cards')
      .insert(filteredData)
      .select()
      .single()

    if (insertError || !customerCard) {
      console.error('Error creating customer card:', insertError)
      return NextResponse.json(
        { error: 'Failed to join card' },
        { status: 500 }
      )
    }

    // Generate wallet pass URLs for all types
    const baseUrl = process.env.BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const cardTypePrefix = isLoyaltyCard ? '' : 'membership/'
    
    const walletPassUrls = {
      apple: `${baseUrl}/api/wallet/apple/${cardTypePrefix}${customerCard.id}`,
      google: `${baseUrl}/api/wallet/google/${cardTypePrefix}${customerCard.id}`,
      pwa: `${baseUrl}/api/wallet/pwa/${cardTypePrefix}${customerCard.id}`
    }

    // Build response based on card type
    const response = {
      success: true,
      customerCardId: customerCard.id,
      cardType: isLoyaltyCard ? 'loyalty' : 'membership',
      card: {
        id: cardData.id,
        name: cardData.name,
        business: {
          id: businessData.id,
          name: businessData.name,
          description: businessData.description
        }
      },
      walletPassUrls,
      message: `Successfully joined ${isLoyaltyCard ? 'stamp card' : 'membership'}!`
    }

    if (isLoyaltyCard) {
      response.card = {
        ...response.card,
        totalStamps: cardData.total_stamps,
        rewardDescription: cardData.reward_description,
        currentStamps: 0
      }
    } else {
      response.card = {
        ...response.card,
        totalSessions: cardData.total_sessions,
        cost: cardData.cost,
        durationDays: cardData.duration_days,
        sessionsUsed: 0,
        expiryDate: expiryDate?.toISOString()
      }
    }

    return NextResponse.json(response)

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