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
      cleanup = false,
      createAll = false
    } = body

    // Cleanup existing test data if requested
    if (cleanup) {
      await cleanupTestData(supabase)
      return NextResponse.json({
        success: true,
        message: 'Test data cleaned up successfully'
      })
    }

    // Create all 8 test scenarios if requested
    if (createAll) {
      const allScenarios = [
        'empty',
        'small_card',
        'large_card', 
        'long_names',
        'half_complete',
        'almost_complete',
        'completed',
        'over_complete'
      ]
      
      const results = []
      for (const scenarioType of allScenarios) {
        const result = await generateTestData(supabase, scenarioType, 1)
        results.push(...result)
      }
      
      return NextResponse.json({
        success: true,
        scenario: 'all_scenarios',
        count: results.length,
        data: results,
        message: `Generated ${results.length} test customer cards across all scenarios`,
        testUrls: results.map(card => ({
          id: card.customerCardId,
          scenario: card.scenario,
          progress: `${card.currentStamps}/${card.totalStamps}`,
          apple: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/${card.customerCardId}`,
          google: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/google/${card.customerCardId}`,
          pwa: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/pwa/${card.customerCardId}`,
          debug: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/${card.customerCardId}?debug=true`
        }))
      })
    }

    // Generate test data based on scenario
    const result = await generateTestData(supabase, scenario, count)
    
    return NextResponse.json({
      success: true,
      scenario,
      count,
      data: result,
      message: `Generated ${result.length} test customer cards`,
      testUrls: result.map(card => ({
        id: card.customerCardId,
        scenario: card.scenario,
        progress: `${card.currentStamps}/${card.totalStamps}`,
        apple: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/${card.customerCardId}`,
        google: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/google/${card.customerCardId}`,
        pwa: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/pwa/${card.customerCardId}`,
        debug: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/${card.customerCardId}?debug=true`
      }))
    })

  } catch (error) {
    console.error('Error in dev seed endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
  
  try {
    // SIMPLIFIED APPROACH: Use existing users or create simple test data
    // First, try to get existing users to avoid foreign key constraints
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, role_id')
      .limit(10)

    let businessOwnerUserId = businessOwnerId
    let customerUserUserId = customerUserId

    // If we have existing users, use them
    if (existingUsers && existingUsers.length > 0) {
      const businessUser = existingUsers.find((u: any) => u.role_id === 2)
      const customerUser = existingUsers.find((u: any) => u.role_id === 3)
      
      if (businessUser) businessOwnerUserId = businessUser.id
      if (customerUser) customerUserUserId = customerUser.id
    }

    // Create business (using existing user ID if available)
    const { error: businessError } = await supabase
      .from('businesses')
      .insert({
        id: businessId,
        owner_id: businessOwnerUserId,
        name: scenarioConfig.businessName,
        description: scenarioConfig.businessDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (businessError) {
      console.error('Error creating business:', businessError)
      throw businessError
    }

    // Create stamp card
    const { error: stampCardError } = await supabase
      .from('stamp_cards')
      .insert({
        id: stampCardId,
        business_id: businessId,
        name: scenarioConfig.stampCardName,
        total_stamps: scenarioConfig.totalStamps,
        reward_description: scenarioConfig.rewardDescription,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (stampCardError) {
      console.error('Error creating stamp card:', stampCardError)
      throw stampCardError
    }

    // Create customer (using existing user ID if available)
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: customerId,
        user_id: customerUserUserId,
        name: scenarioConfig.customerName,
        email: `test-customer-${scenario}-${index}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (customerError) {
      console.error('Error creating customer:', customerError)
      throw customerError
    }

    // Create customer card
    const { error: customerCardError } = await supabase
      .from('customer_cards')
      .insert({
        id: customerCardId,
        customer_id: customerId,
        stamp_card_id: stampCardId,
        current_stamps: scenarioConfig.currentStamps,
        wallet_pass_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (customerCardError) {
      console.error('Error creating customer card:', customerCardError)
      throw customerCardError
    }

    console.log(`✅ Successfully created test scenario: ${scenario} (${index})`)

    return {
      customerCardId: customerCardId,
      scenario: scenario,
      businessName: scenarioConfig.businessName,
      stampCardName: scenarioConfig.stampCardName,
      customerName: scenarioConfig.customerName,
      currentStamps: scenarioConfig.currentStamps,
      totalStamps: scenarioConfig.totalStamps,
      completionPercentage: Math.round((scenarioConfig.currentStamps / scenarioConfig.totalStamps) * 100),
      testUrls: {
        apple: `/api/wallet/apple/${customerCardId}`,
        google: `/api/wallet/google/${customerCardId}`,
        pwa: `/api/wallet/pwa/${customerCardId}`,
        debug: `/api/wallet/apple/${customerCardId}?debug=true`
      }
    }

  } catch (error) {
    console.error(`❌ Error creating test card for scenario ${scenario}:`, error)
    throw error
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
  try {
    console.log('🧹 Starting cleanup of test data...')
    
    // Delete test data in reverse order of dependencies
    
    // Delete wallet update queue entries for test cards
    const { error: queueError } = await supabase
      .from('wallet_update_queue')
      .delete()
      .in('customer_card_id', 
        supabase
          .from('customer_cards')
          .select('id')
          .in('customer_id', 
            supabase
              .from('customers')
              .select('id')
              .like('email', '%test-%')
          )
      )
    
    if (queueError) console.warn('⚠️  Error cleaning wallet update queue:', queueError)

    // Delete customer cards
    const { error: customerCardsError } = await supabase
      .from('customer_cards')
      .delete()
      .in('customer_id', 
        supabase
          .from('customers')
          .select('id')
          .like('email', '%test-%')
      )
    
    if (customerCardsError) console.warn('⚠️  Error cleaning customer cards:', customerCardsError)

    // Delete customers
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .like('email', '%test-%')
    
    if (customersError) console.warn('⚠️  Error cleaning customers:', customersError)

    // Delete stamp cards
    const { error: stampCardsError } = await supabase
      .from('stamp_cards')
      .delete()
      .in('business_id', 
        supabase
          .from('businesses')
          .select('id')
          .like('name', '%Test%')
      )
    
    if (stampCardsError) console.warn('⚠️  Error cleaning stamp cards:', stampCardsError)

    // Delete businesses
    const { error: businessesError } = await supabase
      .from('businesses')
      .delete()
      .like('name', '%Test%')
    
    if (businessesError) console.warn('⚠️  Error cleaning businesses:', businessesError)

    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
} 