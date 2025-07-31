import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🎯 ADMIN CARDS DATA - Fetching card templates...')
  
  try {
    // Create a direct Supabase client with the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const supabase = createServerClient(supabaseUrl, supabaseKey)
    
    // First, let's check if we can access the tables at all
    const { data: stampCardCount, error: countError } = await supabase
      .from('stamp_cards')
      .select('*', { count: 'exact', head: true })
    
    console.log('📊 Stamp cards count check:', { count: stampCardCount, error: countError })
    
    // Fetch stamp cards without inner joins
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .select(`
        id,
        name,
        total_stamps,
        reward_description,
        status,
        created_at,
        business_id
      `)
      .order('created_at', { ascending: false })
    
    console.log('📊 Stamp cards fetch:', { count: stampCards?.length, error: stampError })
    
    // Fetch businesses separately
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
    
    console.log('📊 Businesses fetch:', { count: businesses?.length, error: businessError })
    
    // Fetch membership cards without inner joins
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .select(`
        id,
        name,
        total_sessions,
        cost,
        duration_days,
        status,
        created_at,
        business_id
      `)
      .order('created_at', { ascending: false })
    
    console.log('📊 Membership cards fetch:', { count: membershipCards?.length, error: membershipError })
    
    // Fetch customer cards for counts
    const { data: customerCards, error: customerError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used
      `)
    
    console.log('📊 Customer cards fetch:', { count: customerCards?.length, error: customerError })
    
    // Fetch customers separately
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, email')
    
    console.log('📊 Customers fetch:', { count: customers?.length, error: customersError })
    
    // Create business lookup map
    const businessMap = new Map()
    if (businesses) {
      businesses.forEach(business => {
        businessMap.set(business.id, business)
      })
    }
    
    // Create customer lookup map
    const customerMap = new Map()
    if (customers) {
      customers.forEach(customer => {
        customerMap.set(customer.id, customer)
      })
    }
    
    // Process stamp cards
    const processedStampCards = (stampCards || []).map(card => ({
      ...card,
      businesses: businessMap.get(card.business_id) || null,
      customer_cards: (customerCards || [])
        .filter(cc => cc.stamp_card_id === card.id)
        .map(cc => ({
          id: cc.id,
          current_stamps: cc.current_stamps || 0,
          customers: customerMap.get(cc.customer_id) || { name: 'Unknown', email: 'unknown@example.com' }
        }))
    }))
    
    // Process membership cards
    const processedMembershipCards = (membershipCards || []).map(card => ({
      ...card,
      businesses: businessMap.get(card.business_id) || null,
      customer_cards: (customerCards || [])
        .filter(cc => cc.membership_card_id === card.id)
        .map(cc => ({
          id: cc.id,
          sessions_used: cc.sessions_used || 0,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          customers: customerMap.get(cc.customer_id) || { name: 'Unknown', email: 'unknown@example.com' }
        }))
    }))
    
    const result = {
      success: true,
      data: {
        stampCards: processedStampCards,
        membershipCards: processedMembershipCards,
        stats: {
          totalStampCards: processedStampCards.length,
          totalMembershipCards: processedMembershipCards.length,
          totalCustomers: customers?.length || 0,
          activeCards: processedStampCards.length + processedMembershipCards.length
        }
      },
      debug: {
        rawCounts: {
          stampCards: stampCards?.length || 0,
          membershipCards: membershipCards?.length || 0,
          customerCards: customerCards?.length || 0,
          customers: customers?.length || 0,
          businesses: businesses?.length || 0
        },
        errors: {
          stampError,
          membershipError,
          customerError,
          customersError,
          businessError
        }
      }
    }
    
    console.log('✅ ADMIN CARDS DATA - Success:', result.debug.rawCounts)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ ADMIN CARDS DATA - Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch card data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 