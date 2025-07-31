import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { CustomerCard, CustomerCardWithDetails, ApiResponse, PaginatedResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/customer-cards
 * 
 * Fetches customer cards data for admin panel
 * 
 * Query Parameters:
 * - page: number - Page number for pagination (1-based)
 * - limit: number - Items per page (default: 20, max: 100)
 * - type: 'stamp' | 'membership' - Filter by card type
 * - business_id: string - Filter by business
 * - wallet_type: 'apple' | 'google' | 'pwa' - Filter by wallet type
 * - detailed: boolean - Include full relationships
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const cardType = url.searchParams.get('type') as 'stamp' | 'membership' | null
    const businessId = url.searchParams.get('business_id')
    const walletType = url.searchParams.get('wallet_type') as 'apple' | 'google' | 'pwa' | null
    const detailed = url.searchParams.get('detailed') === 'true'
    
    console.log('🎫 ADMIN CUSTOMER CARDS API - Fetching customer cards:', {
      page,
      limit,
      cardType,
      businessId,
      walletType,
      detailed
    })

    // Build base query
    let query = supabase.from('customer_cards')
    
    if (detailed) {
      query = query.select(`
        id,
        customer_id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        expiry_date,
        wallet_type,
        wallet_pass_id,
        created_at,
        updated_at,
        customers(
          id,
          name,
          email,
          created_at
        ),
        stamp_cards(
          id,
          name,
          total_stamps,
          reward_description,
          business_id,
          businesses(
            id,
            name,
            contact_email
          )
        ),
        membership_cards(
          id,
          name,
          membership_type,
          total_sessions,
          cost,
          duration_days,
          business_id,
          businesses(
            id,
            name,
            contact_email
          )
        )
      `)
    } else {
      query = query.select(`
        id,
        customer_id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        expiry_date,
        wallet_type,
        wallet_pass_id,
        created_at,
        updated_at
      `)
    }

    // Apply filters
    if (cardType === 'stamp') {
      query = query.not('stamp_card_id', 'is', null)
    } else if (cardType === 'membership') {
      query = query.not('membership_card_id', 'is', null)
    }
    
    if (walletType) {
      query = query.eq('wallet_type', walletType)
    }

    // Handle business filter (requires join)
    if (businessId) {
      if (cardType === 'stamp') {
        query = query.eq('stamp_cards.business_id', businessId)
      } else if (cardType === 'membership') {
        query = query.eq('membership_cards.business_id', businessId)
      } else {
        // Filter for both types
        query = query.or(`stamp_cards.business_id.eq.${businessId},membership_cards.business_id.eq.${businessId}`)
      }
    }

    // Handle pagination
    if (page > 1) {
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
    } else {
      query = query.limit(limit)
    }

    // Execute query with count for pagination
    const { data: customerCards, error, count } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('💥 ADMIN CUSTOMER CARDS API - Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer cards' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ ADMIN CUSTOMER CARDS API - Successfully fetched:', customerCards?.length || 0, 'customer cards')

    // Return paginated response if pagination was requested
    if (url.searchParams.has('page')) {
      const totalCount = count || 0
      const hasMore = page * limit < totalCount
      
      const paginatedResponse: PaginatedResponse<CustomerCard | CustomerCardWithDetails> = {
        data: customerCards || [],
        count: totalCount,
        page,
        limit,
        hasMore
      }
      
      return NextResponse.json({
        success: true,
        data: paginatedResponse
      } as ApiResponse<PaginatedResponse<CustomerCard | CustomerCardWithDetails>>)
    }

    // Return simple response
    return NextResponse.json({
      success: true,
      data: customerCards || []
    } as ApiResponse<CustomerCard[] | CustomerCardWithDetails[]>)

  } catch (error) {
    console.error('💥 ADMIN CUSTOMER CARDS API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/customer-cards
 * 
 * Creates a new customer card (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    console.log('🎫 ADMIN CUSTOMER CARDS API - Creating customer card:', body)

    // Validate required fields
    const { 
      customer_id, 
      stamp_card_id, 
      membership_card_id,
      current_stamps = 0,
      sessions_used = 0,
      expiry_date,
      wallet_type
    } = body
    
    if (!customer_id) {
      return NextResponse.json(
        { success: false, error: 'customer_id is required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Validate that exactly one card type is specified
    if ((!stamp_card_id && !membership_card_id) || (stamp_card_id && membership_card_id)) {
      return NextResponse.json(
        { success: false, error: 'Exactly one of stamp_card_id or membership_card_id must be specified' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Create customer card
    const insertData: any = {
      customer_id,
      current_stamps: stamp_card_id ? current_stamps : null,
      sessions_used: membership_card_id ? sessions_used : null,
      wallet_type: wallet_type || null
    }

    if (stamp_card_id) {
      insertData.stamp_card_id = stamp_card_id
    }

    if (membership_card_id) {
      insertData.membership_card_id = membership_card_id
      insertData.expiry_date = expiry_date || null
    }

    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('💥 ADMIN CUSTOMER CARDS API - Create error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create customer card' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ ADMIN CUSTOMER CARDS API - Customer card created:', customerCard.id)

    return NextResponse.json({
      success: true,
      data: customerCard,
      message: 'Customer card created successfully'
    } as ApiResponse<CustomerCard>)

  } catch (error) {
    console.error('💥 ADMIN CUSTOMER CARDS API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}