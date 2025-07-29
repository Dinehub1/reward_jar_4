import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  console.log('🧪 ADMIN CARDS TEST - Testing card data access...')
  
  try {
    const supabase = createAdminClient()
    
    // Test stamp cards access
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .select(`
        id,
        name,
        total_stamps,
        reward_description,
        status,
        business_id,
        businesses(id, name)
      `)
      .limit(5)

    // Test membership cards access
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .select(`
        id,
        name,
        total_sessions,
        cost,
        status,
        business_id,
        businesses(id, name)
      `)
      .limit(5)

    // Test counts
    const [
      { count: stampCount },
      { count: membershipCount }
    ] = await Promise.all([
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true })
    ])

    const result = {
      success: true,
      message: 'Admin cards test completed',
      data: {
        stampCards: {
          count: stampCount,
          sample: stampCards,
          error: stampError
        },
        membershipCards: {
          count: membershipCount,
          sample: membershipCards,
          error: membershipError
        }
      }
    }

    console.log('🧪 ADMIN CARDS TEST - Results:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('🧪 ADMIN CARDS TEST - Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Admin cards test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 