/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Type definitions for Supabase data
interface Business {
  name: string
  description: string
}

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  businesses: Business
}

interface Customer {
  name: string
  email: string
}

// interface CustomerCard {
//   id: string
//   current_stamps: number
//   created_at: string
//   updated_at: string
//   stamp_cards: StampCard
//   customers: Customer
// }

// Development Seed API - Generate test data for wallet testing
// Available in production for testing purposes with optional API key protection
export async function POST(request: NextRequest) {
  // Optional API key protection for production environments
  const apiKey = request.headers.get('x-api-key')
  const requiredApiKey = process.env.DEV_SEED_API_KEY
  
  if (process.env.NODE_ENV === 'production' && requiredApiKey && apiKey !== requiredApiKey) {
    return NextResponse.json(
      { error: 'Invalid or missing API key for dev seed endpoint' },
      { status: 401 }
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

    console.log('🧪 Dev-seed API called:', { scenario, count, cleanup, createAll })

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
      
      console.log('🎯 Generating all test scenarios:', allScenarios)
      const results = []
      
      for (const scenarioType of allScenarios) {
        try {
        const result = await generateTestData(supabase, scenarioType, 1)
        results.push(...result)
          console.log(`✅ Generated scenario: ${scenarioType}`)
        } catch (error) {
          console.error(`❌ Failed to generate scenario ${scenarioType}:`, error)
          // Continue with other scenarios
        }
      }
      
      const baseUrl = process.env.BASE_URL || 'https://www.rewardjar.xyz'
      
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
          apple: `${baseUrl}/api/wallet/apple/${card.customerCardId}`,
          google: `${baseUrl}/api/wallet/google/${card.customerCardId}`,
          pwa: `${baseUrl}/api/wallet/pwa/${card.customerCardId}`,
          debug: `${baseUrl}/api/wallet/apple/${card.customerCardId}?debug=true`
        }))
      })
    }

    // Generate test data based on scenario
    console.log('🎯 Generating single scenario:', scenario)
    const result = await generateTestData(supabase, scenario, count)
    
    const baseUrl = process.env.BASE_URL || 'https://www.rewardjar.xyz'
    
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
        apple: `${baseUrl}/api/wallet/apple/${card.customerCardId}`,
        google: `${baseUrl}/api/wallet/google/${card.customerCardId}`,
        pwa: `${baseUrl}/api/wallet/pwa/${card.customerCardId}`,
        debug: `${baseUrl}/api/wallet/apple/${card.customerCardId}?debug=true`
      }))
    })

  } catch (error) {
    console.error('❌ Error in dev seed endpoint:', error)
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
  // Optional API key protection for production environments
  const apiKey = request.headers.get('x-api-key')
  const requiredApiKey = process.env.DEV_SEED_API_KEY
  
  if (process.env.NODE_ENV === 'production' && requiredApiKey && apiKey !== requiredApiKey) {
    return NextResponse.json(
      { error: 'Invalid or missing API key for dev seed endpoint' },
      { status: 401 }
    )
  }

  try {
    console.log('🔍 Fetching existing test data...')
    const supabase = await createClient()
    
    // Get existing test data with proper joins
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
      .limit(50)

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log('📊 Found test cards:', testCards?.length || 0)

    // Format response for test interface
    const formattedCards = testCards?.map(card => {
      const stampCard = (card.stamp_cards as unknown) as StampCard
      const business = (stampCard?.businesses as unknown) as Business
      const customer = (card.customers as unknown) as Customer
      
      const totalStamps = stampCard?.total_stamps || 10
      const currentStamps = card.current_stamps || 0
      const completionPercentage = Math.round((currentStamps / totalStamps) * 100)
      
      return {
      id: card.id,
        current_stamps: currentStamps,
        total_stamps: totalStamps,
        completion_percentage: completionPercentage,
        stamp_card_name: stampCard?.name || 'Unknown Card',
        business_name: business?.name || 'Unknown Business',
        customer_name: customer?.name || 'Unknown Customer',
        customer_email: customer?.email || 'unknown@example.com',
      created_at: card.created_at,
      updated_at: card.updated_at,
      test_urls: {
        apple: `/api/wallet/apple/${card.id}`,
        google: `/api/wallet/google/${card.id}`,
        pwa: `/api/wallet/pwa/${card.id}`,
        debug: `/api/wallet/apple/${card.id}?debug=true`
      }
      }
    }) || []

    console.log('✅ Formatted cards for test interface:', formattedCards.length)

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
      ],
      message: `Found ${formattedCards.length} test cards`
    })

  } catch (error) {
    console.error('❌ Error fetching test data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generateTestData(supabase: any, scenario: string, count: number) {
  console.log(`🎯 Generating ${count} test cards for scenario: ${scenario}`)
  const results = []
  
  for (let i = 0; i < count; i++) {
    try {
    const testData = await createTestCard(supabase, scenario, i + 1)
    results.push(testData)
    } catch (error) {
      console.error(`❌ Failed to create test card ${i + 1} for scenario ${scenario}:`, error)
      // Continue with other cards
    }
  }
  
  return results
}

async function createTestCard(supabase: any, scenario: string, index: number) {
  // Generate UUIDs for test entities
  const businessId = crypto.randomUUID()
  const customerId = crypto.randomUUID()
  const stampCardId = crypto.randomUUID()
  const customerCardId = crypto.randomUUID()

  // Configure scenario-specific data
  const scenarioConfig = getScenarioConfig(scenario, index)
  
  console.log(`🏗️ Creating test card: ${scenario} #${index}`)
  
  try {
    // Get or create test users to avoid foreign key constraints
    let businessOwnerId = businessId
    let customerUserId = customerId
    
    // Try to get existing test users
    const { data: existingUsers } = await supabase
    .from('users')
      .select('id, role_id, email')
      .or('email.like.*test*,email.like.*example*')
      .limit(10)

    if (existingUsers && existingUsers.length > 0) {
      const businessUser = existingUsers.find((u: any) => u.role_id === 2)
      const customerUser = existingUsers.find((u: any) => u.role_id === 3)
      
      if (businessUser) {
        businessOwnerId = businessUser.id
        console.log('📋 Using existing business user:', businessUser.email)
      }
      if (customerUser) {
        customerUserId = customerUser.id
        console.log('📋 Using existing customer user:', customerUser.email)
      }
  }

  // Create business
  const { error: businessError } = await supabase
    .from('businesses')
    .insert({
      id: businessId,
      owner_id: businessOwnerId,
      name: scenarioConfig.businessName,
        description: scenarioConfig.businessDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    })
      .select()
      .single()
  
    if (businessError) {
      console.error('❌ Error creating business:', businessError)
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
      .select()
      .single()
  
    if (stampCardError) {
      console.error('❌ Error creating stamp card:', stampCardError)
      throw stampCardError
    }

  // Create customer
  const { error: customerError } = await supabase
    .from('customers')
    .insert({
      id: customerId,
      user_id: customerUserId,
      name: scenarioConfig.customerName,
        email: `test-customer-${scenario}-${index}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    })
      .select()
      .single()
  
    if (customerError) {
      console.error('❌ Error creating customer:', customerError)
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
      .select()
      .single()
  
    if (customerCardError) {
      console.error('❌ Error creating customer card:', customerCardError)
      throw customerCardError
    }

    console.log(`✅ Successfully created test scenario: ${scenario} #${index}`)

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
  
    // Delete customer cards first
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