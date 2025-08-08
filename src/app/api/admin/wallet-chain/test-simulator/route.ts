/**
 * Test Customer Simulator API
 * 
 * Create test customers, cards, and simulate wallet generation flows
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { walletGenerationService } from '@/lib/wallet/wallet-generation-service'
import type { ApiResponse } from '@/lib/supabase/types'
import crypto from 'crypto'

interface SimulationRequest {
  action: 'create_customer' | 'create_card' | 'generate_wallet' | 'simulate_flow' | 'cleanup'
  cardType?: 'stamp' | 'membership'
  platforms?: ('apple' | 'google' | 'pwa')[]
  customerCount?: number
  cardCount?: number
  businessId?: string
  testDuration?: number // minutes
}

interface SimulationResult {
  action: string
  success: boolean
  data?: any
  testEntities?: {
    customers: string[]
    cards: string[]
    walletRequests: string[]
  }
  metrics?: {
    totalTime: number
    successRate: number
    errors: string[]
  }
  cleanup?: {
    entitiesRemoved: number
    errors: string[]
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🧪 TEST SIMULATOR: Starting simulation...')

  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Admin role verification
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Parse request body
    const body: SimulationRequest = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      } as ApiResponse<never>, { status: 400 })
    }

    // Execute simulation action
    const result = await executeSimulation(action, body, adminClient, user.id)

    console.log(`✅ TEST SIMULATOR: ${action} completed in ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 TEST SIMULATOR: Critical error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Execute simulation based on action type
 */
async function executeSimulation(action: string, request: SimulationRequest, adminClient: any, userId: string): Promise<SimulationResult> {
  switch (action) {
    case 'create_customer':
      return await createTestCustomer(request, adminClient)
    
    case 'create_card':
      return await createTestCard(request, adminClient)
    
    case 'generate_wallet':
      return await generateTestWallet(request, adminClient)
    
    case 'simulate_flow':
      return await simulateCompleteFlow(request, adminClient)
    
    case 'cleanup':
      return await cleanupTestData(adminClient)
    
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

/**
 * Create test customer with realistic data
 */
async function createTestCustomer(request: SimulationRequest, adminClient: any): Promise<SimulationResult> {
  const customerCount = request.customerCount || 1
  const customers: string[] = []
  const errors: string[] = []

  for (let i = 0; i < customerCount; i++) {
    try {
      const testCustomer = generateTestCustomerData(i)
      
      const { data: customer, error } = await adminClient
        .from('customers')
        .insert(testCustomer)
        .select()
        .single()

      if (error) {
        errors.push(`Customer ${i + 1}: ${error.message}`)
      } else {
        customers.push(customer.id)
      }
    } catch (error) {
      errors.push(`Customer ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    action: 'create_customer',
    success: errors.length === 0,
    data: {
      customersCreated: customers.length,
      customerIds: customers
    },
    testEntities: {
      customers,
      cards: [],
      walletRequests: []
    },
    metrics: {
      totalTime: 0,
      successRate: (customers.length / customerCount) * 100,
      errors
    }
  }
}

/**
 * Create test card with realistic configuration
 */
async function createTestCard(request: SimulationRequest, adminClient: any): Promise<SimulationResult> {
  const cardType = request.cardType || 'stamp'
  const cardCount = request.cardCount || 1
  const businessId = request.businessId
  const cards: string[] = []
  const errors: string[] = []

  // Get or create test business
  let testBusinessId = businessId
  if (!testBusinessId) {
    const testBusiness = await createTestBusiness(adminClient)
    testBusinessId = testBusiness.id
  }

  for (let i = 0; i < cardCount; i++) {
    try {
      if (cardType === 'stamp') {
        const testCard = generateTestStampCard(testBusinessId, i)
        
        const { data: card, error } = await adminClient
          .from('stamp_cards')
          .insert(testCard)
          .select()
          .single()

        if (error) {
          errors.push(`Card ${i + 1}: ${error.message}`)
        } else {
          cards.push(card.id)
        }
      } else {
        const testCard = generateTestMembershipCard(testBusinessId, i)
        
        const { data: card, error } = await adminClient
          .from('membership_cards')
          .insert(testCard)
          .select()
          .single()

        if (error) {
          errors.push(`Card ${i + 1}: ${error.message}`)
        } else {
          cards.push(card.id)
        }
      }
    } catch (error) {
      errors.push(`Card ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    action: 'create_card',
    success: errors.length === 0,
    data: {
      cardType,
      cardsCreated: cards.length,
      cardIds: cards,
      businessId: testBusinessId
    },
    testEntities: {
      customers: [],
      cards,
      walletRequests: []
    },
    metrics: {
      totalTime: 0,
      successRate: (cards.length / cardCount) * 100,
      errors
    }
  }
}

/**
 * Generate test wallet for existing card and customer
 */
async function generateTestWallet(request: SimulationRequest, adminClient: any): Promise<SimulationResult> {
  const platforms = request.platforms || ['apple', 'google', 'pwa']
  const errors: string[] = []
  const walletRequests: string[] = []

  try {
    // Get test card and customer
    const { data: testCard } = await adminClient
      .from('stamp_cards')
      .select('id')
      .like('name', 'Test Stamp Card%')
      .limit(1)
      .single()

    const { data: testCustomer } = await adminClient
      .from('customers')
      .select('id')
      .like('name', 'Test Customer%')
      .limit(1)
      .single()

    if (!testCard || !testCustomer) {
      throw new Error('No test card or customer found. Create them first.')
    }

    // Enqueue wallet generation
    const requestId = await walletGenerationService.enqueueGeneration({
      cardId: testCard.id,
      customerId: testCustomer.id,
      types: platforms,
      priority: 'high',
      metadata: {
        testSimulation: true,
        simulatedAt: new Date().toISOString()
      }
    })

    walletRequests.push(requestId)

    return {
      action: 'generate_wallet',
      success: true,
      data: {
        requestId,
        cardId: testCard.id,
        customerId: testCustomer.id,
        platforms,
        statusUrl: `/api/admin/wallet-provision/status/${requestId}`
      },
      testEntities: {
        customers: [testCustomer.id],
        cards: [testCard.id],
        walletRequests
      },
      metrics: {
        totalTime: 0,
        successRate: 100,
        errors
      }
    }
  } catch (error) {
    return {
      action: 'generate_wallet',
      success: false,
      data: null,
      metrics: {
        totalTime: 0,
        successRate: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

/**
 * Simulate complete end-to-end flow
 */
async function simulateCompleteFlow(request: SimulationRequest, adminClient: any): Promise<SimulationResult> {
  const startTime = Date.now()
  const platforms = request.platforms || ['pwa'] // Use fastest platform for simulation
  const cardType = request.cardType || 'stamp'
  const testDuration = request.testDuration || 5 // 5 minutes default
  
  const customers: string[] = []
  const cards: string[] = []
  const walletRequests: string[] = []
  const errors: string[] = []
  let successfulGenerations = 0

  try {
    console.log(`🚀 Starting ${testDuration}-minute simulation flow...`)

    // Step 1: Create test business
    const testBusiness = await createTestBusiness(adminClient)
    
    // Step 2: Create test customer
    const testCustomer = generateTestCustomerData(0)
    const { data: customer, error: customerError } = await adminClient
      .from('customers')
      .insert(testCustomer)
      .select()
      .single()

    if (customerError) {
      throw new Error(`Failed to create customer: ${customerError.message}`)
    }
    customers.push(customer.id)

    // Step 3: Create test card
    const testCard = cardType === 'stamp' 
      ? generateTestStampCard(testBusiness.id, 0)
      : generateTestMembershipCard(testBusiness.id, 0)
    
    const cardTable = cardType === 'stamp' ? 'stamp_cards' : 'membership_cards'
    const { data: card, error: cardError } = await adminClient
      .from(cardTable)
      .insert(testCard)
      .select()
      .single()

    if (cardError) {
      throw new Error(`Failed to create card: ${cardError.message}`)
    }
    cards.push(card.id)

    // Step 4: Create customer-card relationship
    const customerCardData = {
      customer_id: customer.id,
      created_at: new Date().toISOString()
    }

    if (cardType === 'stamp') {
      customerCardData['stamp_card_id'] = card.id
      customerCardData['current_stamps'] = Math.floor(Math.random() * 5) // Random progress
    } else {
      customerCardData['membership_card_id'] = card.id
      customerCardData['sessions_used'] = Math.floor(Math.random() * 3)
      customerCardData['total_sessions'] = testCard.total_sessions
      customerCardData['cost'] = testCard.cost
      customerCardData['expiry_date'] = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    await adminClient.from('customer_cards').insert(customerCardData)

    // Step 5: Generate wallet passes
    const requestId = await walletGenerationService.enqueueGeneration({
      cardId: card.id,
      customerId: customer.id,
      types: platforms,
      priority: 'high',
      metadata: {
        testSimulation: true,
        flowSimulation: true,
        simulatedAt: new Date().toISOString()
      }
    })

    walletRequests.push(requestId)

    // Step 6: Monitor wallet generation for a few seconds
    let generationCompleted = false
    const maxWaitTime = 30000 // 30 seconds
    const waitStartTime = Date.now()

    while (!generationCompleted && (Date.now() - waitStartTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      
      const result = walletGenerationService.getResult(requestId)
      if (result) {
        generationCompleted = true
        if (result.success) {
          successfulGenerations++
        } else {
          errors.push('Wallet generation failed in simulation')
        }
      }
    }

    if (!generationCompleted) {
      errors.push('Wallet generation timed out in simulation')
    }

    const totalTime = Date.now() - startTime
    const successRate = successfulGenerations > 0 ? 100 : 0

    return {
      action: 'simulate_flow',
      success: errors.length === 0,
      data: {
        flowCompleted: true,
        businessId: testBusiness.id,
        customerId: customer.id,
        cardId: card.id,
        requestId,
        generationCompleted,
        platforms
      },
      testEntities: {
        customers,
        cards,
        walletRequests
      },
      metrics: {
        totalTime,
        successRate,
        errors
      }
    }

  } catch (error) {
    return {
      action: 'simulate_flow',
      success: false,
      data: null,
      testEntities: {
        customers,
        cards,
        walletRequests
      },
      metrics: {
        totalTime: Date.now() - startTime,
        successRate: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

/**
 * Clean up all test data
 */
async function cleanupTestData(adminClient: any): Promise<SimulationResult> {
  const errors: string[] = []
  let entitiesRemoved = 0

  try {
    // Delete test customer cards
    const { error: customerCardsError } = await adminClient
      .from('customer_cards')
      .delete()
      .or('stamp_card_id.in.(select id from stamp_cards where name like "Test%"),membership_card_id.in.(select id from membership_cards where name like "Test%")')

    if (customerCardsError) {
      errors.push(`Customer cards cleanup: ${customerCardsError.message}`)
    } else {
      entitiesRemoved += 10 // Estimate
    }

    // Delete test stamp cards
    const { data: deletedStampCards, error: stampCardsError } = await adminClient
      .from('stamp_cards')
      .delete()
      .like('name', 'Test%')
      .select('id')

    if (stampCardsError) {
      errors.push(`Stamp cards cleanup: ${stampCardsError.message}`)
    } else {
      entitiesRemoved += deletedStampCards?.length || 0
    }

    // Delete test membership cards
    const { data: deletedMembershipCards, error: membershipCardsError } = await adminClient
      .from('membership_cards')
      .delete()
      .like('name', 'Test%')
      .select('id')

    if (membershipCardsError) {
      errors.push(`Membership cards cleanup: ${membershipCardsError.message}`)
    } else {
      entitiesRemoved += deletedMembershipCards?.length || 0
    }

    // Delete test customers
    const { data: deletedCustomers, error: customersError } = await adminClient
      .from('customers')
      .delete()
      .like('name', 'Test Customer%')
      .select('id')

    if (customersError) {
      errors.push(`Customers cleanup: ${customersError.message}`)
    } else {
      entitiesRemoved += deletedCustomers?.length || 0
    }

    // Delete test businesses
    const { data: deletedBusinesses, error: businessesError } = await adminClient
      .from('businesses')
      .delete()
      .like('name', 'Test Business%')
      .select('id')

    if (businessesError) {
      errors.push(`Businesses cleanup: ${businessesError.message}`)
    } else {
      entitiesRemoved += deletedBusinesses?.length || 0
    }

    return {
      action: 'cleanup',
      success: errors.length === 0,
      cleanup: {
        entitiesRemoved,
        errors
      },
      metrics: {
        totalTime: 0,
        successRate: errors.length === 0 ? 100 : 0,
        errors
      }
    }

  } catch (error) {
    return {
      action: 'cleanup',
      success: false,
      cleanup: {
        entitiesRemoved,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      },
      metrics: {
        totalTime: 0,
        successRate: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

/**
 * Generate realistic test customer data
 */
function generateTestCustomerData(index: number) {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
  const domains = ['example.com', 'test.com', 'demo.com']
  
  const name = names[index % names.length]
  const domain = domains[index % domains.length]
  
  return {
    name: `Test Customer ${name} ${index + 1}`,
    email: `test.customer.${name.toLowerCase()}.${index + 1}@${domain}`,
    phone: `+1555${String(index + 1).padStart(3, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    created_at: new Date().toISOString()
  }
}

/**
 * Generate realistic test stamp card data
 */
function generateTestStampCard(businessId: string, index: number) {
  const cardNames = ['Coffee Loyalty', 'Sandwich Special', 'Breakfast Club', 'Lunch Deal']
  const rewards = ['Free Coffee', 'Free Sandwich', 'Free Breakfast', 'Free Meal']
  
  return {
    name: `Test Stamp Card ${cardNames[index % cardNames.length]} ${index + 1}`,
    business_id: businessId,
    stamps_required: [5, 8, 10, 12][index % 4],
    reward: rewards[index % rewards.length],
    reward_description: `Get a ${rewards[index % rewards.length]} after collecting all stamps!`,
    status: 'active',
    card_color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'][index % 4],
    icon_emoji: ['☕', '🥪', '🍳', '🍽️'][index % 4],
    created_at: new Date().toISOString()
  }
}

/**
 * Generate realistic test membership card data
 */
function generateTestMembershipCard(businessId: string, index: number) {
  const cardNames = ['Gym Premium', 'Spa Deluxe', 'Fitness Pro', 'Wellness Plus']
  const types = ['gym', 'spa', 'fitness', 'wellness']
  
  return {
    name: `Test Membership ${cardNames[index % cardNames.length]} ${index + 1}`,
    business_id: businessId,
    membership_type: types[index % types.length],
    total_sessions: [10, 15, 20, 25][index % 4],
    cost: [99.99, 149.99, 199.99, 249.99][index % 4],
    duration_days: [30, 60, 90, 365][index % 4],
    status: 'active',
    card_color: '#10B981',
    icon_emoji: '💪',
    created_at: new Date().toISOString()
  }
}

/**
 * Create test business
 */
async function createTestBusiness(adminClient: any) {
  const testBusiness = {
    name: `Test Business ${crypto.randomUUID().substring(0, 8)}`,
    contact_email: `test.business.${Date.now()}@example.com`,
    description: 'Test business for wallet chain simulation',
    created_at: new Date().toISOString()
  }

  const { data: business, error } = await adminClient
    .from('businesses')
    .insert(testBusiness)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test business: ${error.message}`)
  }

  return business
}