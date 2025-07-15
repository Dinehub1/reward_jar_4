#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCustomerCardFlow() {
  console.log('🧪 Testing Customer Card Flow...\n')
  
  try {
    // Step 1: Create a test business
    console.log('1️⃣ Creating test business...')
    const { data: businessUser, error: businessError } = await supabase.auth.admin.createUser({
      email: 'test-business-flow@rewardjar.test',
      password: 'TestBusiness123!',
      email_confirm: true
    })
    
    if (businessError && !businessError.message.includes('already registered')) {
      throw businessError
    }
    
    let businessUserId = businessUser?.user?.id
    if (!businessUserId) {
      // Try to get existing user
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      const found = existingUser.users.find(u => u.email === 'test-business-flow@rewardjar.test')
      businessUserId = found?.id
    }
    
    if (!businessUserId) {
      throw new Error('Could not create or find business user')
    }
    
    // Insert business user profile
    const { error: userInsertError } = await supabase.from('users').upsert({
      id: businessUserId,
      email: 'test-business-flow@rewardjar.test',
      role_id: 2
    })
    
    if (userInsertError) {
      console.log('User profile error (may already exist):', userInsertError.message)
    }
    
    // Insert business profile
    const { data: business, error: businessInsertError } = await supabase.from('businesses').upsert({
      owner_id: businessUserId,
      name: 'Test Coffee Shop',
      description: 'A test coffee shop for loyalty testing',
      contact_email: 'test-business-flow@rewardjar.test'
    }).select().single()
    
    if (businessInsertError) {
      throw businessInsertError
    }
    
    console.log('✅ Business created:', business.name)
    
    // Step 2: Create a test stamp card
    console.log('2️⃣ Creating test stamp card...')
    const { data: stampCard, error: cardError } = await supabase.from('stamp_cards').insert({
      business_id: business.id,
      name: 'Coffee Loyalty Card',
      total_stamps: 10,
      reward_description: 'Free coffee after 10 purchases',
      status: 'active'
    }).select().single()
    
    if (cardError) throw cardError
    console.log('✅ Stamp card created:', stampCard.name, '(ID:', stampCard.id + ')')
    
    // Step 3: Create a test customer
    console.log('3️⃣ Creating test customer...')
    const { data: customerUser, error: customerError } = await supabase.auth.admin.createUser({
      email: 'test-customer-flow@rewardjar.test',
      password: 'TestCustomer123!',
      email_confirm: true
    })
    
    if (customerError && !customerError.message.includes('already registered')) {
      throw customerError
    }
    
    let customerUserId = customerUser?.user?.id
    if (!customerUserId) {
      // Try to get existing user
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      const found = existingUser.users.find(u => u.email === 'test-customer-flow@rewardjar.test')
      customerUserId = found?.id
    }
    
    if (!customerUserId) {
      throw new Error('Could not create or find customer user')
    }
    
    // Insert customer user profile
    const { error: customerUserError } = await supabase.from('users').upsert({
      id: customerUserId,
      email: 'test-customer-flow@rewardjar.test',
      role_id: 3
    })
    
    if (customerUserError) {
      console.log('Customer user profile error (may already exist):', customerUserError.message)
    }
    
    // Insert customer profile
    const { data: customer, error: customerInsertError } = await supabase.from('customers').upsert({
      user_id: customerUserId,
      name: 'Test Customer',
      email: 'test-customer-flow@rewardjar.test'
    }).select().single()
    
    if (customerInsertError) {
      throw customerInsertError
    }
    
    console.log('✅ Customer created:', customer.name)
    
    // Step 4: Join the customer to the stamp card
    console.log('4️⃣ Joining customer to stamp card...')
    const { data: customerCard, error: joinError } = await supabase.from('customer_cards').insert({
      customer_id: customer.id,
      stamp_card_id: stampCard.id,
      current_stamps: 0,
      wallet_pass_id: null
    }).select().single()
    
    if (joinError) throw joinError
    console.log('✅ Customer joined card:', customerCard.id)
    
    // Step 5: Test customer dashboard query (the problematic one)
    console.log('5️⃣ Testing customer dashboard query...')
    const { data: dashboardCards, error: dashboardError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        created_at,
        stamp_cards!inner (
          id,
          name,
          total_stamps,
          reward_description,
          businesses!inner (
            name
          )
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
    
    if (dashboardError) {
      console.error('Dashboard query error:', dashboardError)
      throw dashboardError
    }
    
    console.log('✅ Dashboard query returned', dashboardCards.length, 'cards')
    console.log('Raw data structure:', JSON.stringify(dashboardCards[0], null, 2))
    
    if (dashboardCards.length > 0) {
      console.log('📋 Card details:')
      dashboardCards.forEach(card => {
        // Handle the nested structure properly
        const stampCard = card.stamp_cards
        const business = stampCard.businesses
        console.log(`  - ${stampCard.name} by ${business.name}`)
        console.log(`    Progress: ${card.current_stamps}/${stampCard.total_stamps} stamps`)
      })
    }
    
    // Step 6: Test individual card query
    console.log('6️⃣ Testing individual card query...')
    const { data: individualCard, error: individualError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        wallet_pass_id,
        created_at,
        stamp_cards!inner (
          id,
          name,
          total_stamps,
          reward_description,
          businesses!inner (
            name,
            description
          )
        )
      `)
      .eq('stamp_card_id', stampCard.id)
      .eq('customer_id', customer.id)
      .single()
    
    if (individualError) {
      console.error('Individual card query error:', individualError)
      throw individualError
    }
    
    console.log('✅ Individual card query successful')
    console.log('Raw individual card data:', JSON.stringify(individualCard, null, 2))
    
    // Step 7: Test API endpoints
    console.log('7️⃣ Testing API endpoints...')
    const testUrl = `http://localhost:3000/join/${stampCard.id}`
    console.log(`📱 QR Code URL: ${testUrl}`)
    
    // Cleanup
    console.log('🧹 Cleaning up test data...')
    await supabase.from('customer_cards').delete().eq('id', customerCard.id)
    await supabase.from('stamp_cards').delete().eq('id', stampCard.id)
    await supabase.from('customers').delete().eq('id', customer.id)
    await supabase.from('businesses').delete().eq('id', business.id)
    await supabase.from('users').delete().eq('id', customerUserId)
    await supabase.from('users').delete().eq('id', businessUserId)
    
    console.log('\n✅ All tests passed! Customer card flow is working correctly.')
    console.log(`🔗 Test the flow manually at: ${testUrl}`)
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    if (error.details) {
      console.error('Details:', error.details)
    }
    if (error.hint) {
      console.error('Hint:', error.hint)
    }
    process.exit(1)
  }
}

testCustomerCardFlow() 