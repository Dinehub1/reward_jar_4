import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    const adminClient = createAdminClient()

    // Get business cards first
    const [
      { data: stampCards, error: stampError },
      { data: membershipCards, error: membershipError }
    ] = await Promise.all([
      adminClient
        .from('stamp_cards')
        .select('id, status')
        .eq('business_id', businessId),
      
      adminClient
        .from('membership_cards')
        .select('id, status, price')
        .eq('business_id', businessId)
    ])

    if (stampError || membershipError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch business cards' },
        { status: 500 }
      )
    }

    // Now get customer cards using the card IDs
    const stampCardIds = stampCards?.map(c => c.id) || []
    const membershipCardIds = membershipCards?.map(c => c.id) || []
    
    let customerCardsQuery = adminClient
      .from('customer_cards')
      .select(`
        id,
        created_at,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        customers!inner(id, email, name)
      `)

    // Add filter only if we have cards
    if (stampCardIds.length > 0 || membershipCardIds.length > 0) {
      const filters = []
      if (stampCardIds.length > 0) {
        filters.push(`stamp_card_id.in.(${stampCardIds.join(',')})`)
      }
      if (membershipCardIds.length > 0) {
        filters.push(`membership_card_id.in.(${membershipCardIds.join(',')})`)
      }
      customerCardsQuery = customerCardsQuery.or(filters.join(','))
    } else {
      // If no cards exist, return empty result
      customerCardsQuery = customerCardsQuery.eq('id', 'no-cards-exist')
    }

    const { data: customerCards, error: customerError } = await customerCardsQuery

    if (customerError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer cards' },
        { status: 500 }
      )
    }

    // Calculate stats
    const totalCards = (stampCards?.length || 0) + (membershipCards?.length || 0)
    const activeCards = (stampCards?.filter(c => c.status === 'active').length || 0) + 
                      (membershipCards?.filter(c => c.status === 'active').length || 0)
    const totalCustomers = customerCards?.length || 0
    
    // Calculate monthly activity (cards created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const monthlyActivity = customerCards?.filter(card => 
      new Date(card.created_at) > thirtyDaysAgo
    ).length || 0

    // Calculate estimated revenue (simplified calculation)
    const revenue = (membershipCards?.reduce((total, card) => total + (card.price || 0), 0) || 0) * 
                   (customerCards?.filter(c => c.membership_card_id).length || 0)

    // Generate recent activity (mock data for now)
    const recentActivity = (customerCards || []).slice(0, 10).map(card => ({
      id: card.id,
      type: card.stamp_card_id ? 'stamp' as const : 'membership' as const,
      description: `${(card as any).customers?.name || (card as any).customers?.email || 'Customer'} ${
        card.stamp_card_id ? `earned ${card.current_stamps} stamps` : 'joined membership'
      }`,
      timestamp: card.created_at,
      customer: (card as any).customers?.name || (card as any).customers?.email
    })) || []

    const stats = {
      totalCards,
      activeCards,
      totalCustomers,
      monthlyActivity,
      revenue: Math.round(revenue),
      recentActivity: recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}