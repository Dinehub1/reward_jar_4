import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  console.log('🔐 ADMIN CLIENT TEST - Testing admin client access...')
  
  try {
    const supabase = createAdminClient()
    
    // Test 1: Count all businesses (should see all, not just user's own)
    const { count: businessCount, error: businessError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })

    console.log('🏢 ADMIN CLIENT TEST - Business count:', businessCount)
    console.log('❌ ADMIN CLIENT TEST - Business error:', businessError)

    // Test 2: Get actual business data
    const { data: businesses, error: businessDataError } = await supabase
      .from('businesses')
      .select('id, name, contact_email')
      .limit(5)

    console.log('📊 ADMIN CLIENT TEST - Business data count:', businesses?.length || 0)
    console.log('❌ ADMIN CLIENT TEST - Business data error:', businessDataError)

    // Test 3: Count customers
    const { count: customerCount, error: customerError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    console.log('👥 ADMIN CLIENT TEST - Customer count:', customerCount)
    console.log('❌ ADMIN CLIENT TEST - Customer error:', customerError)

    // Test 4: Count stamp cards
    const { count: stampCardCount, error: stampCardError } = await supabase
      .from('stamp_cards')
      .select('*', { count: 'exact', head: true })

    console.log('🎴 ADMIN CLIENT TEST - Stamp card count:', stampCardCount)
    console.log('❌ ADMIN CLIENT TEST - Stamp card error:', stampCardError)

    // Test 5: Count customer cards (active cards)
    const { count: customerCardCount, error: customerCardError } = await supabase
      .from('customer_cards')
      .select('*', { count: 'exact', head: true })

    console.log('📋 ADMIN CLIENT TEST - Customer card count:', customerCardCount)
    console.log('❌ ADMIN CLIENT TEST - Customer card error:', customerCardError)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Admin client test completed',
      results: {
        businesses: {
          count: businessCount,
          error: businessError,
          sampleData: businesses
        },
        customers: {
          count: customerCount,
          error: customerError
        },
        stampCards: {
          count: stampCardCount,
          error: stampCardError
        },
        customerCards: {
          count: customerCardCount,
          error: customerCardError
        }
      }
    })

  } catch (error) {
    console.error('💥 ADMIN CLIENT TEST - Overall error:', error)
    return NextResponse.json({ 
      error: 'Admin client test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 