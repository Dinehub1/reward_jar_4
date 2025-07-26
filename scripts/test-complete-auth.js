const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAnon = createClient(supabaseUrl, anonKey)
const supabaseService = createClient(supabaseUrl, serviceRoleKey)

async function testCompleteAuth() {
  console.log('🔐 Testing Complete Authentication Flow with Dashboard Access...')
  
  const testEmail = `auth-flow-${Date.now()}@example.com`
  const testPassword = 'testpass123'
  
  try {
    // Step 1: Test complete signup process
    console.log('\n📝 Step 1: Testing Complete Signup Process...')
    
    // Call our signup API to test the complete flow
    const signupResponse = await fetch('http://localhost:3000/api/auth/complete-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '12345678-1234-1234-1234-123456789012', // This will fail UUID validation
        email: testEmail,
        businessName: 'Test Business'
      })
    })
    
    if (!signupResponse.ok) {
      console.log('✅ Expected: UUID validation correctly rejected invalid UUID')
    }
    
    // Do actual auth signup first
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (signupError) {
      console.error('❌ Auth signup failed:', signupError.message)
      return
    }
    
    console.log('✅ Auth user created:', signupData.user.id)
    
    // Now test our complete signup API with real UUID
    const realSignupResponse = await fetch('http://localhost:3000/api/auth/complete-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: signupData.user.id,
        email: testEmail,
        businessName: 'Test Business'
      })
    })
    
    const signupResult = await realSignupResponse.json()
    
    if (realSignupResponse.ok) {
      console.log('✅ Complete signup API successful:', signupResult.message)
    } else {
      console.error('❌ Complete signup API failed:', signupResult.error)
      return
    }
    
    // Step 2: Test login
    console.log('\n🔑 Step 2: Testing Login...')
    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful')
    console.log('🎫 Session token exists:', !!loginData.session?.access_token)
    
    // Step 3: Test auth status API
    console.log('\n🛡️ Step 3: Testing Auth Status API...')
    const authResponse = await fetch('http://localhost:3000/api/auth/status', {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Cookie': `sb-access-token=${loginData.session.access_token}; sb-refresh-token=${loginData.session.refresh_token}`
      }
    })
    
    const authResult = await authResponse.json()
    
    if (authResponse.ok) {
      console.log('✅ Auth status API successful:', {
        isAuthenticated: authResult.isAuthenticated,
        isBusiness: authResult.isBusiness,
        userRole: authResult.user?.role_id
      })
    } else {
      console.error('❌ Auth status API failed:', authResult.error)
    }
    
    // Step 4: Test business dashboard API
    console.log('\n📊 Step 4: Testing Business Dashboard API...')
    const dashboardResponse = await fetch('http://localhost:3000/api/business/dashboard', {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Cookie': `sb-access-token=${loginData.session.access_token}; sb-refresh-token=${loginData.session.refresh_token}`
      }
    })
    
    const dashboardResult = await dashboardResponse.json()
    
    if (dashboardResponse.ok) {
      console.log('✅ Business dashboard API successful')
      console.log('📋 Profile progress:', dashboardResult.profile_progress)
      console.log('📈 Quick stats available:', !!dashboardResult.quick_stats)
    } else {
      console.error('❌ Business dashboard API failed:', dashboardResult.error)
      console.error('Status:', dashboardResponse.status)
    }
    
    // Step 5: Test direct role verification with service client
    console.log('\n🔧 Step 5: Testing Direct Role Verification...')
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('id, email, role_id')
      .eq('id', signupData.user.id)
      .single()
    
    if (userError) {
      console.error('❌ Service role verification failed:', userError.message)
    } else {
      console.log('✅ Service role verification successful:', userData)
      
      // Check if user can access business
      const { data: businessData, error: businessError } = await supabaseService
        .from('businesses')
        .select('id, name, owner_id')
        .eq('owner_id', userData.id)
        .single()
      
      if (businessError) {
        console.error('❌ Business access failed:', businessError.message)
      } else {
        console.log('✅ Business access successful:', businessData.name)
      }
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...')
    await supabaseService.from('businesses').delete().eq('owner_id', signupData.user.id)
    await supabaseService.from('users').delete().eq('id', signupData.user.id)
    await supabaseService.auth.admin.deleteUser(signupData.user.id)
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 Complete authentication flow test completed!')
    console.log('💡 Summary: If all steps passed, your authentication flow is working correctly!')
    
  } catch (error) {
    console.error('❌ Complete test failed:', error.message)
  }
}

// Check if dev server is running first
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  const serverRunning = await checkDevServer()
  
  if (!serverRunning) {
    console.log('⚠️  Development server is not running on http://localhost:3000')
    console.log('Please run: npm run dev')
    return
  }
  
  console.log('✅ Development server is running')
  await testCompleteAuth()
}

main() 