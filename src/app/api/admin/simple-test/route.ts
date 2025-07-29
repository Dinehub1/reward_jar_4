import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🧪 SIMPLE TEST - Starting individual table tests...')
  
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

    const results: any = {}

    // Test businesses table
    console.log('🏢 Testing businesses table...')
    try {
      const { count: businessCount, error: businessError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
      
      console.log('🏢 Business count result:', businessCount, 'Error:', businessError)
      results.businesses = { count: businessCount, error: businessError }
    } catch (e) {
      console.log('🏢 Business test error:', e)
      results.businesses = { count: null, error: e }
    }

    // Test customers table
    console.log('👥 Testing customers table...')
    try {
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      
      console.log('👥 Customer count result:', customerCount, 'Error:', customerError)
      results.customers = { count: customerCount, error: customerError }
    } catch (e) {
      console.log('👥 Customer test error:', e)
      results.customers = { count: null, error: e }
    }

    // Test stamp_cards table
    console.log('🎴 Testing stamp_cards table...')
    try {
      const { count: stampCount, error: stampError } = await supabase
        .from('stamp_cards')
        .select('*', { count: 'exact', head: true })
      
      console.log('🎴 Stamp cards count result:', stampCount, 'Error:', stampError)
      results.stampCards = { count: stampCount, error: stampError }
    } catch (e) {
      console.log('🎴 Stamp cards test error:', e)
      results.stampCards = { count: null, error: e }
    }

    // Test membership_cards table
    console.log('💳 Testing membership_cards table...')
    try {
      const { count: membershipCount, error: membershipError } = await supabase
        .from('membership_cards')
        .select('*', { count: 'exact', head: true })
      
      console.log('💳 Membership cards count result:', membershipCount, 'Error:', membershipError)
      results.membershipCards = { count: membershipCount, error: membershipError }
    } catch (e) {
      console.log('💳 Membership cards test error:', e)
      results.membershipCards = { count: null, error: e }
    }

    // Test customer_cards table
    console.log('📋 Testing customer_cards table...')
    try {
      const { count: customerCardCount, error: customerCardError } = await supabase
        .from('customer_cards')
        .select('*', { count: 'exact', head: true })
      
      console.log('📋 Customer cards count result:', customerCardCount, 'Error:', customerCardError)
      results.customerCards = { count: customerCardCount, error: customerCardError }
    } catch (e) {
      console.log('📋 Customer cards test error:', e)
      results.customerCards = { count: null, error: e }
    }

    console.log('✅ SIMPLE TEST - All tests completed')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('💥 SIMPLE TEST - Overall error:', error)
    return NextResponse.json({ 
      error: 'Simple test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 