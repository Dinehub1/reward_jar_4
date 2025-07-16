import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Development Seed API - Generate test data for wallet testing
// Only available in development mode
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev seed endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createClient()
    const body = await request.json()
    const { 
      scenario = 'default',
      count = 1,
      cleanup = false
    } = body

    // Cleanup existing test data if requested
    if (cleanup) {
      await cleanupTestData(supabase)
      return NextResponse.json({
        success: true,
        message: 'Test data cleaned up successfully'
      })
    }

    // Generate test data based on scenario
    const result = await generateTestData(supabase, scenario, count)
    
    return NextResponse.json({
      success: true,
      scenario,
      count,
      data: result,
      message: `Generated ${result.length} test customer cards`
    })

  } catch (error) {
    console.error('Error in dev seed endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to generate test data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev seed endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createClient()
    
    // Get existing test data
    const { data: testCards, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        created_at,
        updated_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            name,
            description
          )
        ),
        customers (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    // Format response
    const formattedCards = testCards?.map(card => ({
      id: card.id,
      current_stamps: card.current_stamps,
      total_stamps: (card.stamp_cards as any)?.total_stamps || 0,
      completion_percentage: Math.round(((card.current_stamps / ((card.stamp_cards as any)?.total_stamps || 1)) * 100)),
      stamp_card_name: (card.stamp_cards as any)?.name || 'Unknown',
      business_name: (card.stamp_cards as any)?.businesses?.name || 'Unknown',
      customer_name: (card.customers as any)?.name || 'Unknown',
      customer_email: (card.customers as any)?.email || 'Unknown',
      created_at: card.created_at,
      updated_at: card.updated_at,
      test_urls: {
        apple: `/api/wallet/apple/${card.id}`,
        google: `/api/wallet/google/${card.id}`,
        pwa: `/api/wallet/pwa/${card.id}`,
        debug: `/api/wallet/apple/${card.id}?debug=true`
      }
    })) || []

    return NextResponse.json({
      success: true,
      count: formattedCards.length,
      cards: formattedCards,
      scenarios: [
        'default',
        'empty',
        'half_complete',
        'almost_complete',
        'completed',
        'over_complete',
        'large_card',
        'small_card',
        'long_names'
      ]
    })

  } catch (error) {
    console.error('Error fetching test data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test data' },
      { status: 500 }
    )
  }
}

async function generateTestData(supabase: any, scenario: string, count: number) {
  const results = []
  
  for (let i = 0; i < count; i++) {
    const testData = await createTestCard(supabase, scenario, i + 1)
    results.push(testData)
  }
  
  return results
}

async function createTestCard(supabase: any, scenario: string, index: number) {
  // Generate UUIDs for test entities
  const businessId = crypto.randomUUID()
  const businessOwnerId = crypto.randomUUID()
  const customerId = crypto.randomUUID()
  const customerUserId = crypto.randomUUID()
  const stampCardId = crypto.randomUUID()
  const customerCardId = crypto.randomUUID()

  // Configure scenario-specific data
  const scenarioConfig = getScenarioConfig(scenario, index)
  
  // Create business owner user
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: businessOwnerId,
      email: `test-business-${scenario}-${index}@example.com`,
      role_id: 2 // Business role
    })
  
  if (userError && userError.code !== '23505') { // Ignore duplicate key errors
    throw userError
  }

  // Create customer user
  const { error: customerUserError } = await supabase
    .from('users')
    .insert({
      id: customerUserId,
      email: `test-customer-${scenario}-${index}@example.com`,
      role_id: 3 // Customer role
    })
  
  if (customerUserError && customerUserError.code !== '23505') {
    throw customerUserError
  }

  // Create business
  const { error: businessError } = await supabase
    .from('businesses')
    .insert({
      id: businessId,
      owner_id: businessOwnerId,
      name: scenarioConfig.businessName,
      description: scenarioConfig.businessDescription
    })
  
  if (businessError) throw businessError

  // Create stamp card
  const { error: stampCardError } = await supabase
    .from('stamp_cards')
    .insert({
      id: stampCardId,
      business_id: businessId,
      name: scenarioConfig.stampCardName,
      total_stamps: scenarioConfig.totalStamps,
      reward_description: scenarioConfig.rewardDescription,
      status: 'active'
    })
  
  if (stampCardError) throw stampCardError

  // Create customer
  const { error: customerError } = await supabase
    .from('customers')
    .insert({
      id: customerId,
      user_id: customerUserId,
      name: scenarioConfig.customerName,
      email: `test-customer-${scenario}-${index}@example.com`
    })
  
  if (customerError) throw customerError

  // Create customer card
  const { error: customerCardError } = await supabase
    .from('customer_cards')
    .insert({
      id: customerCardId,
      customer_id: customerId,
      stamp_card_id: stampCardId,
      current_stamps: scenarioConfig.currentStamps,
      wallet_pass_id: null
    })
  
  if (customerCardError) throw customerCardError

  return {
    customer_card_id: customerCardId,
    scenario: scenario,
    business_name: scenarioConfig.businessName,
    stamp_card_name: scenarioConfig.stampCardName,
    customer_name: scenarioConfig.customerName,
    current_stamps: scenarioConfig.currentStamps,
    total_stamps: scenarioConfig.totalStamps,
    completion_percentage: Math.round((scenarioConfig.currentStamps / scenarioConfig.totalStamps) * 100),
    test_urls: {
      apple: `/api/wallet/apple/${customerCardId}`,
      google: `/api/wallet/google/${customerCardId}`,
      pwa: `/api/wallet/pwa/${customerCardId}`,
      debug: `/api/wallet/apple/${customerCardId}?debug=true`
    }
  }
}

function getScenarioConfig(scenario: string, index: number) {
  const baseConfig = {
    businessName: `Test Business ${index}`,
    businessDescription: `Test business for scenario ${scenario}`,
    stampCardName: `Test Stamp Card ${index}`,
    customerName: `Test Customer ${index}`,
    totalStamps: 10,
    currentStamps: 5,
    rewardDescription: 'Test reward description'
  }

  switch (scenario) {
    case 'empty':
      return {
        ...baseConfig,
        businessName: `Empty Card Business ${index}`,
        stampCardName: `Empty Card Test ${index}`,
        currentStamps: 0,
        rewardDescription: 'Free item when you collect 10 stamps'
      }
    
    case 'half_complete':
      return {
        ...baseConfig,
        businessName: `Half Complete Business ${index}`,
        stampCardName: `Half Complete Test ${index}`,
        currentStamps: 5,
        rewardDescription: 'Free coffee when you collect 10 stamps'
      }
    
    case 'almost_complete':
      return {
        ...baseConfig,
        businessName: `Almost Complete Business ${index}`,
        stampCardName: `Almost Complete Test ${index}`,
        currentStamps: 9,
        rewardDescription: 'Free meal when you collect 10 stamps'
      }
    
    case 'completed':
      return {
        ...baseConfig,
        businessName: `Completed Business ${index}`,
        stampCardName: `Completed Test ${index}`,
        currentStamps: 10,
        rewardDescription: 'Free premium item - reward earned!'
      }
    
    case 'over_complete':
      return {
        ...baseConfig,
        businessName: `Over Complete Business ${index}`,
        stampCardName: `Over Complete Test ${index}`,
        currentStamps: 12,
        rewardDescription: 'Free premium item - reward earned!'
      }
    
    case 'large_card':
      return {
        ...baseConfig,
        businessName: `Large Card Business ${index}`,
        stampCardName: `Large Card Test ${index}`,
        totalStamps: 50,
        currentStamps: 15,
        rewardDescription: 'Free premium package when you collect 50 stamps'
      }
    
    case 'small_card':
      return {
        ...baseConfig,
        businessName: `Small Card Business ${index}`,
        stampCardName: `Small Card Test ${index}`,
        totalStamps: 3,
        currentStamps: 2,
        rewardDescription: 'Free item when you collect 3 stamps'
      }
    
    case 'long_names':
      return {
        ...baseConfig,
        businessName: `Very Long Business Name That Might Cause Display Issues In Wallet ${index}`,
        stampCardName: `Very Long Stamp Card Name That Tests Text Overflow ${index}`,
        customerName: `Very Long Customer Name That Tests Display ${index}`,
        rewardDescription: 'Very long reward description that tests how the wallet handles extended text content and word wrapping in the pass display'
      }
    
    default: // 'default'
      return baseConfig
  }
}

async function cleanupTestData(supabase: any) {
  // Delete test data in reverse order of dependencies
  
  // Delete wallet update queue entries
  await supabase
    .from('wallet_update_queue')
    .delete()
    .in('customer_card_id', supabase
      .from('customer_cards')
      .select('id')
      .in('customer_id', supabase
        .from('customers')
        .select('id')
        .like('email', '%test-%')
      )
    )

  // Delete customer cards
  await supabase
    .from('customer_cards')
    .delete()
    .in('customer_id', supabase
      .from('customers')
      .select('id')
      .like('email', '%test-%')
    )

  // Delete customers
  await supabase
    .from('customers')
    .delete()
    .like('email', '%test-%')

  // Delete stamp cards
  await supabase
    .from('stamp_cards')
    .delete()
    .in('business_id', supabase
      .from('businesses')
      .select('id')
      .like('name', '%Test%')
    )

  // Delete businesses
  await supabase
    .from('businesses')
    .delete()
    .like('name', '%Test%')

  // Delete users
  await supabase
    .from('users')
    .delete()
    .like('email', '%test-%')
} 