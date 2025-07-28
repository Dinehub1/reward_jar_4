/**
 * RewardJar 4.0 - Admin Card Creation Test Data API
 * Generates admin-created cards with proper business assignments
 * 
 * @version 4.0
 * @path /api/dev-seed/admin-cards
 * @created July 28, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    stamp_card_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
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
      console.log('🧹 Cleaning up admin test data...')
      
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

    console.log('🎯 Creating admin test data ecosystem...')

    // 1. Create admin user
    const { error: adminUserError } = await supabase
      .from('users')
      .upsert(ADMIN_USER, { onConflict: 'id' })

    if (adminUserError) {
      console.error('Admin user creation error:', adminUserError)
    }

    // 2. Create business owner users
    const { error: businessUsersError } = await supabase
      .from('users')
      .upsert(BUSINESS_OWNERS, { onConflict: 'id' })

    if (businessUsersError) {
      console.error('Business users creation error:', businessUsersError)
    }

    // 3. Create customer user
    const { error: customerUserError } = await supabase
      .from('users')
      .upsert(TEST_CUSTOMER_USER, { onConflict: 'id' })

    if (customerUserError) {
      console.error('Customer user creation error:', customerUserError)
    }

    // 4. Create test businesses
    const { error: businessError } = await supabase
      .from('businesses')
      .upsert(TEST_BUSINESSES, { onConflict: 'id' })

    if (businessError) {
      console.error('Business creation error:', businessError)
    }

    // 5. Create customer profile
    const { error: customerError } = await supabase
      .from('customers')
      .upsert(TEST_CUSTOMER, { onConflict: 'id' })

    if (customerError) {
      console.error('Customer creation error:', customerError)
    }

    // 6. Create admin-created stamp cards
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .upsert(ADMIN_STAMP_CARDS, { onConflict: 'id' })
      .select()

    if (stampError) {
      console.error('Stamp cards creation error:', stampError)
    }

    // 7. Create admin-created membership cards
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .upsert(ADMIN_MEMBERSHIP_CARDS, { onConflict: 'id' })
      .select()

    if (membershipError) {
      console.error('Membership cards creation error:', membershipError)
    }

    // 8. Create customer cards for testing
    const { data: customerCards, error: customerCardsError } = await supabase
      .from('customer_cards')
      .upsert(CUSTOMER_CARDS, { onConflict: 'id' })
      .select()

    if (customerCardsError) {
      console.error('Customer cards creation error:', customerCardsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Admin test data ecosystem created successfully',
      data: {
        adminUser: ADMIN_USER.email,
        businesses: TEST_BUSINESSES.length,
        businessOwners: BUSINESS_OWNERS.length,
        stampCards: stampCards?.length || 0,
        membershipCards: membershipCards?.length || 0,
        customerCards: customerCards?.length || 0,
        testCustomer: TEST_CUSTOMER.email
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
        adminUserId: ADMIN_USER.id,
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
    console.error('Error in admin cards dev-seed:', error)
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
    console.error('Error checking admin test data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check admin test data status'
    }, { status: 500 })
  }
} 