const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Test both regular and service role connections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('❌ Missing environment variables')
  console.log('Required variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY') 
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAnon = createClient(supabaseUrl, anonKey)
const supabaseService = createClient(supabaseUrl, serviceRoleKey)

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...')
  console.log('📍 URL:', supabaseUrl)
  
  try {
    // Test 1: Check if we can connect with service role
    console.log('\n🔧 Test 1: Service Role Connection')
    const { data: tables, error: tablesError } = await supabaseService
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'businesses', 'roles'])
    
    if (tablesError) {
      console.error('❌ Service role connection failed:', tablesError.message)
    } else {
      console.log('✅ Service role connected successfully')
      console.log('📋 Found tables:', tables?.map(t => t.table_name).join(', '))
    }

    // Test 2: Check roles table
    console.log('\n👥 Test 2: Roles Table')
    const { data: roles, error: rolesError } = await supabaseService
      .from('roles')
      .select('*')
    
    if (rolesError) {
      console.error('❌ Roles query failed:', rolesError.message)
    } else {
      console.log('✅ Roles table accessible')
      console.log('📋 Available roles:', roles)
    }

    // Test 3: Test user creation with service role
    console.log('\n👤 Test 3: User Creation Test')
    const testUserId = 'test-user-' + Date.now()
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: userResult, error: userError } = await supabaseService
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        role_id: 2
      })
      .select()
    
    if (userError) {
      console.error('❌ User creation failed:', userError.message)
      console.error('❌ Error code:', userError.code)
      console.error('❌ Error details:', userError.details)
    } else {
      console.log('✅ User creation successful')
      
      // Clean up test user
      await supabaseService
        .from('users')
        .delete()
        .eq('id', testUserId)
      console.log('🧹 Test user cleaned up')
    }

    // Test 4: Test business creation
    console.log('\n🏢 Test 4: Business Creation Test')
    const testBusinessName = `Test Business ${Date.now()}`
    
    const { data: businessResult, error: businessError } = await supabaseService
      .from('businesses')
      .insert({
        name: testBusinessName,
        contact_email: testEmail,
        owner_id: testUserId,
        status: 'active'
      })
      .select()
    
    if (businessError) {
      console.error('❌ Business creation failed:', businessError.message)
      console.error('❌ Error code:', businessError.code)
    } else {
      console.log('✅ Business creation successful')
      
      // Clean up test business
      await supabaseService
        .from('businesses')
        .delete()
        .eq('name', testBusinessName)
      console.log('🧹 Test business cleaned up')
    }

    // Test 5: Check RLS policies
    console.log('\n🛡️ Test 5: RLS Policies Check')
    const { data: policies, error: policiesError } = await supabaseService
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd, permissive')
      .eq('schemaname', 'public')
      .in('tablename', ['users', 'businesses'])
    
    if (policiesError) {
      console.error('❌ Policies query failed:', policiesError.message)
    } else {
      console.log('✅ RLS policies found:')
      policies?.forEach(policy => {
        console.log(`  📋 ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
      })
    }

    console.log('\n🎉 Connection test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

testConnection() 