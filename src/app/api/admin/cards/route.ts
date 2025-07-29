import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-only'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin (role_id = 1)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role_id !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all stamp cards with business info
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .select(`
        *,
        businesses (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (stampError) {
      console.error('Error fetching stamp cards:', stampError)
      return NextResponse.json({ error: 'Failed to fetch stamp cards' }, { status: 500 })
    }

    // Get all membership cards with business info
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .select(`
        *,
        businesses (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (membershipError) {
      console.error('Error fetching membership cards:', membershipError)
      return NextResponse.json({ error: 'Failed to fetch membership cards' }, { status: 500 })
    }

    // Format the response
    const allCards = [
      ...(stampCards?.map(card => ({
        ...card,
        type: 'stamp',
        business_name: (card.businesses as any)?.name || 'Unknown Business'
      })) || []),
      ...(membershipCards?.map(card => ({
        ...card,
        type: 'membership',
        business_name: (card.businesses as any)?.name || 'Unknown Business'
      })) || [])
    ]

    return NextResponse.json({
      success: true,
      data: {
        stampCards: stampCards || [],
        membershipCards: membershipCards || [],
        allCards: allCards,
        totalCards: allCards.length
      }
    })

  } catch (error) {
    console.error('Error in admin cards API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 