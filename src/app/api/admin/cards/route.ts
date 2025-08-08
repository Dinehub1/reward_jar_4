import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import type { ApiResponse, StampConfig, CardFormData } from '@/lib/supabase/types'
import { normalizeCardData, createDatabasePayload, validateCardData } from '@/lib/utils/field-mapping'

/**
 * HEAD /api/admin/cards
 * 
 * Quick health check for cards API without fetching data
 */
export async function HEAD() {
  try {
    const supabase = createAdminClient()
    
    // Simple count query for health check
    const { count, error } = await supabase
      .from('stamp_cards')
      .select('*', { count: 'exact', head: true })
      .limit(1)

    if (error) {
      return new NextResponse(null, { status: 500 })
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'X-Total-Cards': count?.toString() || '0'
      }
    })
  } catch (error) {
    console.error('Cards API health check error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

/**
 * GET /api/admin/cards
 * 
 * Fetches all cards for admin panel with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    
    // Parse query parameters
    const businessId = url.searchParams.get('business_id')
    const cardType = url.searchParams.get('type') // 'stamp' | 'membership'
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    console.log('🎫 ADMIN CARDS API - Fetching cards:', {
      businessId,
      cardType,
      status,
      page,
      limit
    })

    let stampCards = []
    let membershipCards = []

    // Fetch stamp cards
    if (!cardType || cardType === 'stamp') {
      let stampQuery = supabase
        .from('stamp_cards')
        .select(`
          *,
          businesses!inner (
            id,
            name,
            contact_email,
            logo_url
          )
        `)

      if (businessId) stampQuery = stampQuery.eq('business_id', businessId)
      if (status) stampQuery = stampQuery.eq('status', status)

      const { data: stampData, error: stampError } = await stampQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (stampError) {
        console.error('💥 ADMIN CARDS API - Stamp cards error:', stampError)
      } else {
        stampCards = stampData || []
      }
    }

    // Fetch membership cards  
    if (!cardType || cardType === 'membership') {
      let membershipQuery = supabase
        .from('membership_cards')
        .select(`
          *,
          businesses!inner (
            id,
            name,
            contact_email,
            logo_url
          )
        `)

      if (businessId) membershipQuery = membershipQuery.eq('business_id', businessId)
      if (status) membershipQuery = membershipQuery.eq('status', status)

      const { data: membershipData, error: membershipError } = await membershipQuery
        .range(offset, offset + limit - 1) 
        .order('created_at', { ascending: false })

      if (membershipError) {
        console.error('💥 ADMIN CARDS API - Membership cards error:', membershipError)
      } else {
        membershipCards = membershipData || []
      }
    }

    // Combine and format results
    const allCards = [
      ...stampCards.map(card => ({ ...card, card_type: 'stamp' })),
      ...membershipCards.map(card => ({ ...card, card_type: 'membership' }))
    ]

    // Sort by created_at if combining both types
    if (!cardType) {
      allCards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return NextResponse.json({
      success: true,
      data: allCards,
      pagination: {
        page,
        limit,
        total: allCards.length
      }
    } as ApiResponse<any[]>)

  } catch (error) {
    console.error('💥 ADMIN CARDS API - GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cards' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cards
 * 
 * Creates a new card (stamp or membership) via admin interface
 * Uses admin client to bypass RLS for card creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Enhanced card creation schema supporting both stamp and membership cards
    const { 
      // Common fields for both card types
      card_type = 'stamp_card', // 'stamp_card' or 'membership_card'
      card_name,
      business_id, 
      card_color,
      icon_emoji,
      barcode_type,
      card_expiry_days,
      card_description,
      
      // Stamp card specific fields
      reward, 
      reward_description,
      stamps_required,
      reward_expiry_days,
      stamp_config,
      how_to_earn_stamp,
      reward_details,
      earned_stamp_message,
      earned_reward_message,
      
      // Membership card specific fields  
      membership_type = 'gym',
      total_sessions,
      cost,
      duration_days,
      membership_config,
      how_to_use_card,
      membership_details,
      session_used_message,
      membership_expired_message,
      
      // Legacy support for older forms
      cardName,
      businessId,
      stampsRequired,
      cardColor,
      iconEmoji,
      barcodeType,
      cardExpiryDays,
      rewardExpiryDays,
      stampConfig,
      name, 
      status,
      values,
      stamp_condition,
      min_bill_amount
    } = body

    console.log('🔍 Admin API: Creating card:', { 
      cardType: card_type,
      cardName: card_name || cardName || name, 
      businessId: business_id || businessId, 
      isStampCard: card_type === 'stamp_card',
      isMembershipCard: card_type === 'membership_card'
    })

    // Use server client to authenticate the user
    const supabase = await createServerClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Admin API: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Admin API: Access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Common fields for both card types
    const finalCardName = card_name || cardName || name
    const finalBusinessId = business_id || businessId
    const finalCardColor = card_color || cardColor || '#8B4513'
    const finalIconEmoji = icon_emoji || iconEmoji || '⭐'
    const finalBarcodeType = barcode_type || barcodeType || 'QR_CODE'
    const finalCardExpiryDays = card_expiry_days || cardExpiryDays || 60

    // Validate common required fields
    if (!finalCardName || !finalBusinessId) {
      return NextResponse.json(
        { success: false, error: 'Card name and business ID are required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Handle stamp card creation
    if (card_type === 'stamp_card') {
      const finalStampsRequired = stamps_required || stampsRequired || values?.total_stamps
      
      if (!reward || !finalStampsRequired) {
        return NextResponse.json(
          { success: false, error: 'Reward and stamps required are mandatory for stamp cards' } as ApiResponse<never>,
          { status: 400 }
        )
      }

      const stampCardPayload = {
        business_id: finalBusinessId,
        // Populate BOTH old and new name fields for compatibility
        name: finalCardName, // Legacy field required by database
        card_name: finalCardName, // New canonical field
        // Populate BOTH old and new stamp fields
        total_stamps: finalStampsRequired, // Legacy field
        stamps_required: finalStampsRequired, // New canonical field
        // Populate BOTH old and new expiry fields  
        expiry_days: finalCardExpiryDays, // Legacy field
        card_expiry_days: finalCardExpiryDays, // New canonical field
        reward: reward,
        reward_description: reward_description || '',
        card_color: finalCardColor,
        icon_emoji: finalIconEmoji,
        barcode_type: finalBarcodeType,
        reward_expiry_days: reward_expiry_days || rewardExpiryDays || 15,
        stamp_config: stamp_config || stampConfig || {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '12h'
        },
        card_description: card_description || 'Collect stamps to get rewards',
        how_to_earn_stamp: how_to_earn_stamp || 'Buy anything to get a stamp',
        reward_details: reward_details || '',
        earned_stamp_message: earned_stamp_message || 'Just [#] more stamps to get your reward!',
        earned_reward_message: earned_reward_message || 'Reward is earned and waiting for you!',
        status: 'active'
      }

      const { data: savedCard, error } = await adminClient
        .from('stamp_cards')
        .insert([stampCardPayload])
        .select()
        .single()

      if (error) {
        console.error('💥 ADMIN CARDS API - Stamp card creation error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to create stamp card', details: error.message } as ApiResponse<never>,
          { status: 500 }
        )
      }

      console.log('✅ ADMIN CARDS API - Stamp card created successfully:', savedCard.id)
      return NextResponse.json({
        success: true,
        data: { ...savedCard, card_type: 'stamp_card' },
        message: 'Stamp card created successfully'
      } as ApiResponse<any>)

    } 
    // Handle membership card creation
    else if (card_type === 'membership_card') {
      if (!total_sessions || !cost || !duration_days) {
        return NextResponse.json(
          { success: false, error: 'Total sessions, cost, and duration are mandatory for membership cards' } as ApiResponse<never>,
          { status: 400 }
        )
      }

      const membershipCardPayload = {
        business_id: finalBusinessId,
        name: finalCardName,
        membership_type: membership_type || 'gym',
        total_sessions: total_sessions,
        cost: cost,
        duration_days: duration_days || 30,
        card_color: finalCardColor,
        icon_emoji: finalIconEmoji,
        barcode_type: finalBarcodeType,
        card_expiry_days: finalCardExpiryDays,
        membership_config: membership_config || {
          autoSessionTracking: true,
          accessControl: true,
          allowGuestAccess: false,
          sessionBuffer: '1h',
          membershipTier: 'standard'
        },
        card_description: card_description || 'Access premium services with your membership',
        how_to_use_card: how_to_use_card || 'Show this card for access and session tracking',
        membership_details: membership_details || 'Membership includes access to all services',
        session_used_message: session_used_message || 'Session recorded! {#} sessions remaining',
        membership_expired_message: membership_expired_message || 'Your membership has expired. Please renew to continue',
        status: 'active'
      }

      const { data: savedCard, error } = await adminClient
        .from('membership_cards')
        .insert([membershipCardPayload])
        .select()
        .single()

      if (error) {
        console.error('💥 ADMIN CARDS API - Membership card creation error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to create membership card', details: error.message } as ApiResponse<never>,
          { status: 500 }
        )
      }

      console.log('✅ ADMIN CARDS API - Membership card created successfully:', savedCard.id)
      return NextResponse.json({
        success: true,
        data: { ...savedCard, card_type: 'membership_card' },
        message: 'Membership card created successfully'
      } as ApiResponse<any>)

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid card type. Must be "stamp_card" or "membership_card"' } as ApiResponse<never>,
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('💥 ADMIN CARDS API - POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create card' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

 