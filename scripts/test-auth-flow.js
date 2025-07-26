const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAnon = createClient(supabaseUrl, anonKey)
const supabaseService = createClient(supabaseUrl, serviceRoleKey)

async function testAuthFlow() {
  console.log('🔐 Testing Complete Authentication Flow...')
  
  const testEmail = `test-auth-${Date.now()}@example.com`
  const testPassword = 'testpass123'
  const testBusinessName = `Test Business ${Date.now()}`
  
  try {
    // Step 1: Test user signup
    console.log('\n📝 Step 1: Testing Signup...')
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/callback`
      }
    })
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError.message)
      return
    }
    
    if (!signupData.user) {
      console.error('❌ No user returned from signup')
      return
    }
    
    console.log('✅ Auth user created:', signupData.user.id)
    console.log('📧 Email:', signupData.user.email)
    
    // Step 2: Create user profile using service role (bypasses RLS)
    console.log('\n👤 Step 2: Creating user profile...')
    const { error: userProfileError } = await supabaseService
      .from('users')
      .insert({
        id: signupData.user.id,
        email: testEmail,
        role_id: 2 // Business role
      })
    
    if (userProfileError && userProfileError.code !== '23505') {
      console.error('❌ User profile creation failed:', userProfileError)
      return
    }
    console.log('✅ User profile created with role_id: 2 (business)')
    
    // Step 3: Create business profile
    console.log('\n🏢 Step 3: Creating business profile...')
    const { error: businessError } = await supabaseService
      .from('businesses')
      .insert({
        name: testBusinessName,
        description: 'Test business for auth flow',
        contact_email: testEmail,
        owner_id: signupData.user.id,
        status: 'active'
      })
    
    if (businessError && businessError.code !== '23505') {
      console.error('❌ Business profile creation failed:', businessError)
      return
    }
    console.log('✅ Business profile created')
    
    // Step 4: Test login
    console.log('\n🔑 Step 4: Testing login...')
    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful')
    console.log('🎫 Session exists:', !!loginData.session)
    console.log('👤 User ID:', loginData.user?.id)
    
    // Step 5: Test role verification (as would happen in protected route)
    console.log('\n🛡️ Step 5: Testing role verification...')
    const { data: userData, error: roleError } = await supabaseAnon
      .from('users')
      .select('id, email, role_id')
      .eq('id', loginData.user.id)
      .single()
    
    if (roleError) {
      console.error('❌ Role verification failed:', roleError.message)
      console.error('❌ This might be due to RLS policies')
      
      // Try with service role
      console.log('🔧 Trying with service role...')
      const { data: serviceUserData, error: serviceRoleError } = await supabaseService
        .from('users')
        .select('id, email, role_id')
        .eq('id', loginData.user.id)
        .single()
      
      if (serviceRoleError) {
        console.error('❌ Service role verification also failed:', serviceRoleError.message)
        return
      } else {
        console.log('✅ Service role verification successful:', serviceUserData)
        console.log('⚠️  Issue: Regular user cannot read their own profile due to RLS')
      }
    } else {
      console.log('✅ Role verification successful:', userData)
    }
    
    // Step 6: Test business dashboard access
    console.log('\n📊 Step 6: Testing business access...')
    const { data: businessData, error: businessAccessError } = await supabaseAnon
      .from('businesses')
      .select('id, name, owner_id')
      .eq('owner_id', loginData.user.id)
      .single()
    
    if (businessAccessError) {
      console.error('❌ Business access failed:', businessAccessError.message)
      console.error('❌ This might be due to RLS policies')
    } else {
      console.log('✅ Business access successful:', businessData)
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await supabaseService.from('businesses').delete().eq('owner_id', signupData.user.id)
    await supabaseService.from('users').delete().eq('id', signupData.user.id)
    await supabaseService.auth.admin.deleteUser(signupData.user.id)
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 Auth flow test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

testAuthFlow() 