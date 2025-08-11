/**
 * RewardJar 4.0 - Demo Data Seeding Script
 * Generates stamp cards and membership cards with QR codes for testing
 * 
 * @version 4.0
 * @author RewardJar Development Team
 * @created July 21, 2025
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test card IDs from test-wallet-preview.md
const TEST_CARD_IDS = {
  stampCard1: '3e234610-9953-4a8b-950e-b03a1924a1fe',
  stampCard2: '10e2488a-7c4b-495d-a5ee-ec5a7ec4f13e',
  membershipCard1: '90910c9c-f8cc-4e49-b53c-87863f8f30a5',
  membershipCard2: '27deeb58-376f-4c4a-99a9-244404b50885'
}

// Demo business data inspired by reference image
const DEMO_BUSINESSES = [
  {
    id: '539c1e0d-c7e8-4237-abb2-90f3ae29f903',
    name: 'NIO coffee',
    description: 'Premium coffee experience with artisanal blends',
    logo_url: 'https://example.com/nio-coffee-logo.png',
    type: 'coffee_shop'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'FitLife Gym',
    description: 'Modern fitness center with premium equipment',
    logo_url: 'https://example.com/fitlife-logo.png',
    type: 'gym'
  }
]

// Demo stamp card configurations
const STAMP_CARD_CONFIGS = [
  {
    id: TEST_CARD_IDS.stampCard1,
    business_id: DEMO_BUSINESSES[0].id,
    name: 'NIO Coffee Loyalty Card',
    total_stamps: 10,
    current_stamps: 3,
    reward_description: '6TH on us - Get your 6th coffee free when you collect 10 stamps!',
    grid_layout: '5x2',
    primary_color: '#3B82F6', // Blue to match reference image
    membership_type: 'loyalty'
  },
  {
    id: TEST_CARD_IDS.stampCard2,
    business_id: DEMO_BUSINESSES[0].id,
    name: 'NIO Premium Rewards',
    total_stamps: 12,
    current_stamps: 7,
    reward_description: 'Premium blend coffee + pastry combo free with 12 stamps',
    grid_layout: '4x3',
    primary_color: '#10b981', // Green theme
    membership_type: 'loyalty'
  }
]

// Demo membership card configurations
const MEMBERSHIP_CARD_CONFIGS = [
  {
    id: TEST_CARD_IDS.membershipCard1,
    business_id: DEMO_BUSINESSES[1].id,
    name: 'FitLife Premium Membership',
    total_sessions: 20,
    sessions_used: 5,
    cost: 15000, // ₩15,000
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    secondary_color: '#6366f1', // Indigo theme
    membership_type: 'gym'
  },
  {
    id: TEST_CARD_IDS.membershipCard2,
    business_id: DEMO_BUSINESSES[1].id,
    name: 'FitLife Basic Membership',
    total_sessions: 10,
    sessions_used: 8,
    cost: 8000, // ₩8,000
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    secondary_color: '#8B5CF6', // Purple theme
    membership_type: 'gym'
  }
]

/**
 * Generate QR code URL for customer card
 */
function generateQRCodeUrl(customerCardId: string, qrType: string = 'session_mark'): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  switch (qrType) {
    case 'session_mark':
      return `${baseUrl}/api/wallet/mark-session/${customerCardId}`
    case 'wallet_add':
      return `${baseUrl}/join/${customerCardId}`
    case 'reward_redeem':
      return `${baseUrl}/api/wallet/mark-session/${customerCardId}?action=reward`
    default:
      return `${baseUrl}/join/${customerCardId}`
  }
}

/**
 * Create demo businesses
 */
async function createDemoBusinesses() {
  console.log('🏢 Creating demo businesses...')
  
  for (const business of DEMO_BUSINESSES) {
    const { data, error } = await supabase
      .from('businesses')
      .upsert({
        id: business.id,
        name: business.name,
        description: business.description,
        owner_id: '00000000-0000-0000-0000-000000000001', // Demo owner ID
        status: 'active',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error(`❌ Error creating business ${business.name}:`, error)
    } else {
      console.log(`✅ Created business: ${business.name}`)
    }
  }
}

/**
 * Create demo stamp cards
 */
async function createDemoStampCards() {
  console.log('🃏 Creating demo stamp cards...')
  
  for (const config of STAMP_CARD_CONFIGS) {
    // Create stamp card template
    const { data: stampCard, error: stampError } = await supabase
      .from('stamp_cards')
      .upsert({
        id: config.id,
        business_id: config.business_id,
        name: config.name,
        total_stamps: config.total_stamps,
        reward_description: config.reward_description,
        status: 'active',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (stampError) {
      console.error(`❌ Error creating stamp card ${config.name}:`, stampError)
      continue
    }

    // Create customer card instance
    const { data: customerCard, error: customerError } = await supabase
      .from('customer_cards')
      .upsert({
        id: config.id,
        customer_id: '00000000-0000-0000-0000-000000000002', // Demo customer ID
        stamp_card_id: config.id,
        current_stamps: config.current_stamps,
        membership_type: config.membership_type,
        wallet_type: 'pwa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (customerError) {
      console.error(`❌ Error creating customer card ${config.name}:`, customerError)
      continue
    }

    // Create card customization
    const { data: customization, error: customError } = await supabase
      .from('card_customizations')
      .upsert({
        business_id: config.business_id,
        card_type: 'stamp',
        business_name: DEMO_BUSINESSES.find(b => b.id === config.business_id)?.name,
        logo_url: DEMO_BUSINESSES.find(b => b.id === config.business_id)?.logo_url,
        total_stamps_or_sessions: config.total_stamps,
        expiry_days: 365,
        stamp_grid_layout: config.grid_layout,
        primary_color: config.primary_color,
        secondary_color: '#6366f1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,card_type'
      })

    if (customError) {
      console.error(`❌ Error creating customization for ${config.name}:`, customError)
    }

    console.log(`✅ Created stamp card: ${config.name} (${config.current_stamps}/${config.total_stamps} stamps, ${config.grid_layout} grid)`)
  }
}

/**
 * Create demo membership cards
 */
async function createDemoMembershipCards() {
  console.log('🏋️ Creating demo membership cards...')
  
  for (const config of MEMBERSHIP_CARD_CONFIGS) {
    // Create membership card template
    const { data: membershipCard, error: membershipError } = await supabase
      .from('membership_cards')
      .upsert({
        id: config.id,
        business_id: config.business_id,
        name: config.name,
        membership_type: 'gym',
        total_sessions: config.total_sessions,
        cost: config.cost,
        duration_days: 90,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (membershipError) {
      console.error(`❌ Error creating membership card ${config.name}:`, membershipError)
      continue
    }

    // Create customer card instance
    const { data: customerCard, error: customerError } = await supabase
      .from('customer_cards')
      .upsert({
        id: config.id,
        customer_id: '00000000-0000-0000-0000-000000000003', // Demo customer ID
        stamp_card_id: config.id, // Reference to membership template
        current_stamps: 0,
        membership_type: config.membership_type,
        total_sessions: config.total_sessions,
        sessions_used: config.sessions_used,
        cost: config.cost,
        expiry_date: config.expiry_date,
        wallet_type: 'apple',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (customerError) {
      console.error(`❌ Error creating customer membership ${config.name}:`, customerError)
      continue
    }

    // Create card customization for membership
    const { data: customization, error: customError } = await supabase
      .from('card_customizations')
      .upsert({
        business_id: config.business_id,
        card_type: 'membership',
        business_name: DEMO_BUSINESSES.find(b => b.id === config.business_id)?.name,
        logo_url: DEMO_BUSINESSES.find(b => b.id === config.business_id)?.logo_url,
        total_stamps_or_sessions: config.total_sessions,
        expiry_days: 90,
        stamp_grid_layout: '1x1', // Not applicable for membership
        primary_color: '#10b981',
        secondary_color: config.secondary_color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,card_type'
      })

    if (customError) {
      console.error(`❌ Error creating membership customization for ${config.name}:`, customError)
    }

    console.log(`✅ Created membership: ${config.name} (${config.sessions_used}/${config.total_sessions} sessions, ₩${config.cost.toLocaleString()})`)
  }
}

/**
 * Generate QR codes for all demo cards
 */
async function generateQRCodes() {
  console.log('📱 Generating QR codes for demo cards...')
  
  const allCardIds = Object.values(TEST_CARD_IDS)
  const qrTypes = ['session_mark', 'wallet_add', 'reward_redeem']
  
  for (const cardId of allCardIds) {
    for (const qrType of qrTypes) {
      const qrUrl = generateQRCodeUrl(cardId, qrType)
      
      const { data, error } = await supabase
        .from('qr_codes')
        .upsert({
          customer_card_id: cardId,
          qr_url: qrUrl,
          qr_type: qrType,
          usage_count: 0,
          created_at: new Date().toISOString(),
          expires_at: qrType === 'reward_redeem' 
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours for rewards
            : null // No expiry for session marking and wallet adding
        }, {
          onConflict: 'customer_card_id,qr_type'
        })

      if (error) {
        console.error(`❌ Error creating QR code for ${cardId} (${qrType}):`, error)
      } else {
        console.log(`✅ Generated QR code: ${qrType} for card ${cardId.substring(0, 8)}...`)
      }
    }
  }
}

/**
 * Create demo session usage history
 */
async function createDemoSessionHistory() {
  console.log('📊 Creating demo session usage history...')
  
  const sessionHistory = [
    // Stamp card 1 history (3 stamps collected)
    { card_id: TEST_CARD_IDS.stampCard1, usage_type: 'stamp', days_ago: 10 },
    { card_id: TEST_CARD_IDS.stampCard1, usage_type: 'stamp', days_ago: 7 },
    { card_id: TEST_CARD_IDS.stampCard1, usage_type: 'stamp', days_ago: 3 },
    
    // Stamp card 2 history (7 stamps collected)
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 15 },
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 12 },
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 9 },
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 6 },
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 4 },
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 2 },
    { card_id: TEST_CARD_IDS.stampCard2, usage_type: 'stamp', days_ago: 1 },
    
    // Membership card 1 history (5 sessions used)
    { card_id: TEST_CARD_IDS.membershipCard1, usage_type: 'session', days_ago: 20 },
    { card_id: TEST_CARD_IDS.membershipCard1, usage_type: 'session', days_ago: 17 },
    { card_id: TEST_CARD_IDS.membershipCard1, usage_type: 'session', days_ago: 14 },
    { card_id: TEST_CARD_IDS.membershipCard1, usage_type: 'session', days_ago: 10 },
    { card_id: TEST_CARD_IDS.membershipCard1, usage_type: 'session', days_ago: 5 },
    
    // Membership card 2 history (8 sessions used)
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 25 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 22 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 19 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 16 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 13 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 10 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 7 },
    { card_id: TEST_CARD_IDS.membershipCard2, usage_type: 'session', days_ago: 3 }
  ]

  for (const session of sessionHistory) {
    const sessionDate = new Date(Date.now() - session.days_ago * 24 * 60 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('session_usage')
      .insert({
        customer_card_id: session.card_id,
        business_id: session.card_id.startsWith('3e234610') || session.card_id.startsWith('10e2488a') 
          ? DEMO_BUSINESSES[0].id // Coffee shop
          : DEMO_BUSINESSES[1].id, // Gym
        usage_type: session.usage_type,
        session_date: sessionDate.toISOString(),
        notes: `Demo ${session.usage_type} usage`,
        created_at: sessionDate.toISOString()
      })

    if (error) {
      console.error(`❌ Error creating session history:`, error)
    }
  }

  console.log(`✅ Created ${sessionHistory.length} session history records`)
}

/**
 * API Integration - Call dev-seed endpoints
 */
async function callDevSeedAPIs() {
  console.log('🌱 Calling dev-seed API endpoints...')
  
  try {
    // Call loyalty card dev-seed
    const loyaltyResponse = await fetch('http://localhost:3000/api/dev-seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scenario: 'stamp_grid_demo',
        count: 1,
        gridLayout: '5x2',
        currentStamps: 3,
        totalStamps: 10,
        businessName: 'NIO coffee',
        logoUrl: 'https://example.com/nio-coffee-logo.png'
      })
    })

    if (loyaltyResponse.ok) {
      const loyaltyData = await loyaltyResponse.json()
      console.log('✅ Loyalty dev-seed API called successfully:', loyaltyData.message)
    } else {
      console.warn('⚠️ Loyalty dev-seed API call failed:', loyaltyResponse.statusText)
    }

    // Call membership card dev-seed
    const membershipResponse = await fetch('http://localhost:3000/api/dev-seed/membership', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scenario: 'gym_membership_demo',
        count: 1,
        totalSessions: 20,
        sessionsUsed: 5,
        cost: 15000,
        businessName: 'FitLife Gym',
        logoUrl: 'https://example.com/fitlife-logo.png'
      })
    })

    if (membershipResponse.ok) {
      const membershipData = await membershipResponse.json()
      console.log('✅ Membership dev-seed API called successfully:', membershipData.message)
    } else {
      console.warn('⚠️ Membership dev-seed API call failed:', membershipResponse.statusText)
    }

  } catch (error) {
    console.error('❌ Error calling dev-seed APIs:', error)
  }
}

/**
 * Print demo data summary
 */
function printDemoSummary() {
  console.log('\n🎉 Demo Data Generation Complete!')
  console.log('═'.repeat(50))
  
  console.log('\n📊 Generated Demo Data:')
  console.log(`• ${DEMO_BUSINESSES.length} demo businesses`)
  console.log(`• ${STAMP_CARD_CONFIGS.length} stamp cards with grid layouts`)
  console.log(`• ${MEMBERSHIP_CARD_CONFIGS.length} membership cards`)
  console.log(`• ${Object.keys(TEST_CARD_IDS).length * 3} QR codes (3 types per card)`)
  console.log('• Session usage history for analytics')
  
  console.log('\n🃏 Stamp Cards:')
  STAMP_CARD_CONFIGS.forEach(card => {
    console.log(`  • ${card.name}: ${card.current_stamps}/${card.total_stamps} stamps (${card.grid_layout} grid)`)
    console.log(`    ID: ${card.id}`)
    console.log(`    QR: /join/${card.id}`)
  })
  
  console.log('\n🏋️ Membership Cards:')
  MEMBERSHIP_CARD_CONFIGS.forEach(card => {
    console.log(`  • ${card.name}: ${card.sessions_used}/${card.total_sessions} sessions (₩${card.cost.toLocaleString()})`)
    console.log(`    ID: ${card.id}`)
    console.log(`    QR: /join/${card.id}`)
  })
  
  console.log('\n🧪 Test Commands:')
  console.log('# Test stamp card display')
  console.log(`curl "http://localhost:3000/customer/card/${TEST_CARD_IDS.stampCard1}"`)
  console.log('\n# Test membership card display')
  console.log(`curl "http://localhost:3000/customer/card/${TEST_CARD_IDS.membershipCard1}"`)
  console.log('\n# Test QR session marking')
  console.log(`curl -X POST "http://localhost:3000/api/wallet/mark-session/${TEST_CARD_IDS.stampCard1}" \\`)
  console.log('  -H "Content-Type: application/json" \\')
  console.log('  -d \'{"usageType": "auto"}\'')
  
  console.log('\n✨ Ready for testing!')
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting RewardJar 4.0 Demo Data Generation...')
  console.log('═'.repeat(50))
  
  try {
    await createDemoBusinesses()
    await createDemoStampCards()
    await createDemoMembershipCards()
    await generateQRCodes()
    await createDemoSessionHistory()
    await callDevSeedAPIs()
    
    printDemoSummary()
    
  } catch (error) {
    console.error('❌ Error during demo data generation:', error)
    process.exit(1)
  }
}

// Export functions for individual use
export {
  createDemoBusinesses,
  createDemoStampCards,
  createDemoMembershipCards,
  generateQRCodes,
  createDemoSessionHistory,
  callDevSeedAPIs,
  TEST_CARD_IDS,
  DEMO_BUSINESSES,
  STAMP_CARD_CONFIGS,
  MEMBERSHIP_CARD_CONFIGS
}

// Run if called directly
if (require.main === module) {
  main()
} 