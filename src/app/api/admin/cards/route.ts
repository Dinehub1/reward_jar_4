import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { StampCard, MembershipCard, ApiResponse } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    const cardType = url.searchParams.get('type') as 'stamp' | 'membership' | null
    
    console.log('🎫 ADMIN CARDS API - Fetching cards:', { cardType })

    if (cardType === 'stamp') {
      // Get only stamp cards
      const { data: stampCards, error } = await supabase
        .from('stamp_cards')
        .select(`
          id,
          business_id,
          name,
          total_stamps,
          reward_description,
          status,
          created_at,
          businesses (
            id,
            name,
            contact_email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('💥 ADMIN CARDS API - Error fetching stamp cards:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch stamp cards' } as ApiResponse<never>,
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: stampCards || []
      } as ApiResponse<StampCard[]>)

    } else if (cardType === 'membership') {
      // Get only membership cards
      const { data: membershipCards, error } = await supabase
        .from('membership_cards')
        .select(`
          id,
          business_id,
          name,
          membership_type,
          total_sessions,
          cost,
          duration_days,
          status,
          created_at,
          updated_at,
          businesses (
            id,
            name,
            contact_email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('💥 ADMIN CARDS API - Error fetching membership cards:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch membership cards' } as ApiResponse<never>,
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: membershipCards || []
      } as ApiResponse<MembershipCard[]>)

    } else {
      // Get both types of cards
      const [stampResult, membershipResult] = await Promise.all([
        supabase
          .from('stamp_cards')
          .select(`
            id,
            business_id,
            name,
            total_stamps,
            reward_description,
            status,
            created_at,
            businesses (
              id,
              name,
              contact_email
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('membership_cards')
          .select(`
            id,
            business_id,
            name,
            membership_type,
            total_sessions,
            cost,
            duration_days,
            status,
            created_at,
            updated_at,
            businesses (
              id,
              name,
              contact_email
            )
          `)
          .order('created_at', { ascending: false })
      ])

      if (stampResult.error) {
        console.error('💥 ADMIN CARDS API - Error fetching stamp cards:', stampResult.error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch stamp cards' } as ApiResponse<never>,
          { status: 500 }
        )
      }

      if (membershipResult.error) {
        console.error('💥 ADMIN CARDS API - Error fetching membership cards:', membershipResult.error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch membership cards' } as ApiResponse<never>,
          { status: 500 }
        )
      }

      console.log('✅ ADMIN CARDS API - Successfully fetched:', {
        stampCards: stampResult.data?.length || 0,
        membershipCards: membershipResult.data?.length || 0
      })

      return NextResponse.json({
        success: true,
        data: {
          stampCards: stampResult.data || [],
          membershipCards: membershipResult.data || [],
          total: (stampResult.data?.length || 0) + (membershipResult.data?.length || 0)
        }
      } as ApiResponse<{
        stampCards: StampCard[]
        membershipCards: MembershipCard[]
        total: number
      }>)
    }

  } catch (error) {
    console.error('💥 ADMIN CARDS API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
} 