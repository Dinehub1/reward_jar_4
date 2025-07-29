import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Test business data loading
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at')
      .order('name')
      .limit(5)

    if (businessError) {
      console.error('Business error:', businessError)
      return NextResponse.json({ error: 'Failed to fetch businesses', details: businessError }, { status: 500 })
    }

    // Test stamp cards data loading
    const { data: stampCards, error: cardsError } = await supabase
      .from('stamp_cards')
      .select(`
        id,
        name,
        total_stamps,
        businesses!inner(name)
      `)
      .limit(5)

    if (cardsError) {
      console.error('Cards error:', cardsError)
      return NextResponse.json({ error: 'Failed to fetch cards', details: cardsError }, { status: 500 })
    }

    // Test customer cards data loading
    const { data: customerCards, error: customerError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        stamp_cards!inner(name, businesses!inner(name))
      `)
      .limit(5)

    if (customerError) {
      console.error('Customer cards error:', customerError)
      return NextResponse.json({ error: 'Failed to fetch customer cards', details: customerError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        businesses: businesses || [],
        stampCards: stampCards || [],
        customerCards: customerCards || []
      },
      counts: {
        businesses: businesses?.length || 0,
        stampCards: stampCards?.length || 0,
        customerCards: customerCards?.length || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test data API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 