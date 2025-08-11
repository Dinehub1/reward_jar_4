/**
 * RewardJar 4.0 - Admin Card Creation Test Data API
 * Generates admin-created cards with proper business assignments
 * 
 * @version 4.0
 * @path /api/dev-seed/admin-cards
 * @created July 28, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// Initialize Supabase admin client for dev seeding
const supabase = createAdminClient()

// Admin test user data
const ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@rewardjar.xyz',
  role_id: 1
}

// Test businesses for admin-created cards
const TEST_BUSINESSES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin Test Coffee Shop',
    description: 'Test coffee shop for admin-created stamp cards',
    contact_email: 'coffee@test.com',
    owner_id: '22222222-2222-2222-2222-222222222222', // Business owner, not admin
    status: 'active'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Admin Test Gym',
    description: 'Test gym for admin-created membership cards',
    contact_email: 'gym@test.com',
    owner_id: '44444444-4444-4444-4444-444444444444', // Business owner, not admin
    status: 'active'
  }
]

// Business owner users
const BUSINESS_OWNERS = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'coffee-owner@test.com',
    role_id: 2
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'gym-owner@test.com',
    role_id: 2
  }
]

// Test customer
const TEST_CUSTOMER = {
  id: '55555555-5555-5555-5555-555555555555',
  user_id: '66666666-6666-6666-6666-666666666666',
  name: 'Test Customer',
  email: 'customer@test.com'
}

const TEST_CUSTOMER_USER = {
  id: '66666666-6666-6666-6666-666666666666',
  email: 'customer@test.com',
  role_id: 3
}

// Admin-created stamp cards
const ADMIN_STAMP_CARDS = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin Coffee Loyalty',
    total_stamps: 10,
    reward_description: 'Get your 10th coffee free! (Admin created)',
    status: 'active'
  }
]

// Admin-created membership cards
const ADMIN_MEMBERSHIP_CARDS = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    business_id: '33333333-3333-3333-3333-333333333333',
    name: 'Admin Gym Membership',
    membership_type: 'gym',
    total_sessions: 20,
    cost: 15000,
    duration_days: 90,
    status: 'active'
  }
]

// Customer cards for testing
const CUSTOMER_CARDS = [
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    customer_id: '55555555-5555-5555-5555-555555555555',
    stamp_card_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    current_stamps: 3,
    membership_type: 'loyalty',
    wallet_type: 'pwa'
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    customer_id: '55555555-5555-5555-5555-555555555555',
    membership_card_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    membership_type: 'gym',
    total_sessions: 20,
    sessions_used: 5,
    cost: 15000,
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    wallet_type: 'apple'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cleanup = false, businesses = 2, stampCardsPerBusiness = 1, membershipCardsPerBusiness = 1, customersPerCard = 1 } = body

    if (cleanup) {
      
      // Delete in reverse dependency order
      await supabase.from('customer_cards').delete().in('id', CUSTOMER_CARDS.map(c => c.id))
      await supabase.from('customers').delete().eq('id', TEST_CUSTOMER.id)
      await supabase.from('membership_cards').delete().in('id', ADMIN_MEMBERSHIP_CARDS.map(c => c.id))
      await supabase.from('stamp_cards').delete().in('id', ADMIN_STAMP_CARDS.map(c => c.id))
      await supabase.from('businesses').delete().in('id', TEST_BUSINESSES.map(b => b.id))
      await supabase.from('users').delete().in('id', [ADMIN_USER.id, ...BUSINESS_OWNERS.map(u => u.id), TEST_CUSTOMER_USER.id])
      
      return NextResponse.json({
        success: true,
        message: 'Admin test data cleanup completed',
        timestamp: new Date().toISOString()
      })
    }


    // 1. Use existing users from the database or create minimal test data
    // Since users table has foreign key to auth.users, we'll use existing users
    // or create them with a different approach
    
    
    // Try to find existing admin user, or use service role approach
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('role_id', 1)
      .limit(1)
      .single()

    const { data: existingBusiness } = await supabase
      .from('users')
      .select('*')
      .eq('role_id', 2)
      .limit(1)
      .single()

    const { data: existingCustomer } = await supabase
      .from('users')
      .select('*')
      .eq('role_id', 3)
      .limit(1)
      .single()

    // Use existing users or skip user creation for now
    const adminUserId = existingAdmin?.id || ADMIN_USER.id
    const businessUserId = existingBusiness?.id || BUSINESS_OWNERS[0].id
    const customerUserId = existingCustomer?.id || TEST_CUSTOMER_USER.id


    // 2. Create test businesses using existing user IDs
    const updatedBusinesses = TEST_BUSINESSES.map((business, index) => ({
      ...business,
      owner_id: index === 0 ? businessUserId : businessUserId // Use same business user for both
    }))

    const { error: businessError } = await supabase
      .from('businesses')
      .upsert(updatedBusinesses, { onConflict: 'id' })

    if (businessError) {
    }

    // 3. Create customer profile using existing user ID
    const updatedCustomer = {
      ...TEST_CUSTOMER,
      user_id: customerUserId
    }

    const { error: customerError } = await supabase
      .from('customers')
      .upsert(updatedCustomer, { onConflict: 'id' })

    if (customerError) {
    }

    // 4. Create admin-created stamp cards first
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .upsert(ADMIN_STAMP_CARDS, { onConflict: 'id' })
      .select()

    if (stampError) {
    } else {
    }

    // 5. Create admin-created membership cards
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .upsert(ADMIN_MEMBERSHIP_CARDS, { onConflict: 'id' })
      .select()

    if (membershipError) {
    } else {
    }

    // 5b. Create corresponding stamp_cards entries for membership cards
    // This is needed because customer_cards.stamp_card_id must reference stamp_cards.id
    let membershipStampCards = null
    if (membershipCards && membershipCards.length > 0) {
      const membershipStampCardsData = membershipCards.map(membershipCard => ({
        id: membershipCard.id, // Use same ID as membership card
        business_id: membershipCard.business_id,
        name: membershipCard.name,
        total_stamps: membershipCard.total_sessions, // Map sessions to stamps for compatibility
        reward_description: `Complete ${membershipCard.total_sessions} sessions to finish your membership`,
        status: membershipCard.status
      }))

      const { data: createdMembershipStampCards, error: membershipStampError } = await supabase
        .from('stamp_cards')
        .upsert(membershipStampCardsData, { onConflict: 'id' })
        .select()

      if (membershipStampError) {
      } else {
        membershipStampCards = createdMembershipStampCards
      }
    }

    // 6. Create customer cards for testing using actual created card IDs
    const customerCardsToCreate = []
    
    // Create customer card for stamp card (if stamp card was created successfully)
    if (stampCards && stampCards.length > 0) {
      customerCardsToCreate.push({
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        customer_id: updatedCustomer.id,
        stamp_card_id: stampCards[0].id, // Use actual created stamp card ID
        current_stamps: 3,
        membership_type: 'loyalty',
        wallet_type: 'pwa'
      })
    }

    // Create customer card for membership card (using corresponding stamp card)
    if (membershipStampCards && membershipStampCards.length > 0) {
      customerCardsToCreate.push({
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        customer_id: updatedCustomer.id,
        stamp_card_id: membershipStampCards[0].id, // Use corresponding stamp card ID
        membership_type: 'gym',
        total_sessions: 20,
        sessions_used: 5,
        cost: 15000,
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        wallet_type: 'apple'
      })
    }

    let customerCards = null
    let customerCardsError = null

    if (customerCardsToCreate.length > 0) {
      const result = await supabase
        .from('customer_cards')
        .upsert(customerCardsToCreate, { onConflict: 'id' })
        .select()
      
      customerCards = result.data
      customerCardsError = result.error

          if (customerCardsError) {
    } else {
    }
    } else {
    }

    return NextResponse.json({
      success: true,
      message: 'Admin test data ecosystem created successfully',
      data: {
        adminUser: existingAdmin?.email || 'Using existing admin',
        businesses: updatedBusinesses.length,
        businessOwners: 'Using existing business users',
        stampCards: stampCards?.length || 0,
        membershipCards: membershipCards?.length || 0,
        customerCards: customerCards?.length || 0,
        testCustomer: existingCustomer?.email || 'Using existing customer',
        userIds: { adminUserId, businessUserId, customerUserId }
      },
      testUrls: {
        adminDashboard: '/admin',
        adminCards: '/admin/cards',
        businessCoffee: '/business/dashboard',
        businessGym: '/business/dashboard',
        customerStampCard: `/customer/card/${CUSTOMER_CARDS[0].id}`,
        customerMembershipCard: `/customer/card/${CUSTOMER_CARDS[1].id}`,
        walletPreview: '/test/wallet-preview'
      },
      testIds: {
        adminUserId: adminUserId,
        coffeeBusinessId: TEST_BUSINESSES[0].id,
        gymBusinessId: TEST_BUSINESSES[1].id,
        stampCardId: ADMIN_STAMP_CARDS[0].id,
        membershipCardId: ADMIN_MEMBERSHIP_CARDS[0].id,
        customerStampCardId: CUSTOMER_CARDS[0].id,
        customerMembershipCardId: CUSTOMER_CARDS[1].id
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check status of admin test data
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', ADMIN_USER.id)
      .single()

    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .in('id', TEST_BUSINESSES.map(b => b.id))

    const { data: stampCards } = await supabase
      .from('stamp_cards')
      .select('*')
      .in('id', ADMIN_STAMP_CARDS.map(c => c.id))

    const { data: membershipCards } = await supabase
      .from('membership_cards')
      .select('*')
      .in('id', ADMIN_MEMBERSHIP_CARDS.map(c => c.id))

    const { data: customerCards } = await supabase
      .from('customer_cards')
      .select('*')
      .in('id', CUSTOMER_CARDS.map(c => c.id))

    return NextResponse.json({
      success: true,
      status: {
        adminUser: adminUser ? 'exists' : 'missing',
        businesses: businesses?.length || 0,
        stampCards: stampCards?.length || 0,
        membershipCards: membershipCards?.length || 0,
        customerCards: customerCards?.length || 0
      },
      data: {
        adminUser,
        businesses,
        stampCards,
        membershipCards,
        customerCards
      },
      ready: !!(adminUser && businesses?.length && stampCards?.length && membershipCards?.length)
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check admin test data status'
    }, { status: 500 })
  }
} 