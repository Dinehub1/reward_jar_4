import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🚀 DEBUG API - Starting comprehensive data fetch test...')
  
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

    console.log('🔑 DEBUG API - Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // Test 1: Simple count queries
    console.log('📊 DEBUG API - Testing count queries...')
    const [
      businessCount,
      customerCount,
      stampCardCount,
      membershipCardCount,
      customerCardCount
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true }),
      supabase.from('customer_cards').select('*', { count: 'exact', head: true })
    ])

    console.log('📈 DEBUG API - Count results:', {
      businesses: businessCount.count,
      customers: customerCount.count,
      stampCards: stampCardCount.count,
      membershipCards: membershipCardCount.count,
      customerCards: customerCardCount.count
    })

    // Test 2: Fetch actual data samples
    console.log('🎯 DEBUG API - Fetching data samples...')
    const { data: businessSample, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at')
      .limit(5)

    console.log('🏢 DEBUG API - Business sample:', businessSample)
    console.log('❌ DEBUG API - Business error:', businessError)

    const { data: cardSample, error: cardError } = await supabase
      .from('stamp_cards')
      .select('id, name, total_stamps, business_id')
      .limit(5)

    console.log('🎴 DEBUG API - Card sample:', cardSample)
    console.log('❌ DEBUG API - Card error:', cardError)

    const { data: customerSample, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, created_at')
      .limit(5)

    console.log('👥 DEBUG API - Customer sample:', customerSample)
    console.log('❌ DEBUG API - Customer error:', customerError)

    // Test 3: Complex join query (like in admin pages)
    console.log('🔗 DEBUG API - Testing complex joins...')
    const { data: complexData, error: complexError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        contact_email,
        stamp_cards(id, name),
        users!businesses_owner_id_fkey(email)
      `)
      .limit(3)

    console.log('🔗 DEBUG API - Complex join data:', complexData)
    console.log('❌ DEBUG API - Complex join error:', complexError)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      },
      counts: {
        businesses: businessCount.count,
        customers: customerCount.count,
        stampCards: stampCardCount.count,
        membershipCards: membershipCardCount.count,
        customerCards: customerCardCount.count
      },
      samples: {
        businesses: businessSample,
        cards: cardSample,
        customers: customerSample,
        complexJoin: complexData
      },
      errors: {
        business: businessError,
        card: cardError,
        customer: customerError,
        complex: complexError
      }
    })

  } catch (error) {
    console.error('💥 DEBUG API - Catch block error:', error)
    return NextResponse.json({ 
      error: 'Debug API failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 