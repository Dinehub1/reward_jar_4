const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseService = createClient(supabaseUrl, serviceRoleKey)

async function fixUsersRLS() {
  console.log('🔧 Fixing Users Table RLS Policies...')
  
  try {
    // Use a different approach - execute the policy changes via RPC or direct queries
    console.log('📋 Step 1: Checking current RLS policies...')
    
    // Try to execute SQL commands one by one
    const commands = [
      // Drop existing policies
      'DROP POLICY IF EXISTS "Users can view and update their own data" ON public.users',
      'DROP POLICY IF EXISTS "Users can manage their own data" ON public.users',
      'DROP POLICY IF EXISTS "Enable read access for own data" ON public.users',
      'DROP POLICY IF EXISTS "Enable insert for own data" ON public.users',
      'DROP POLICY IF EXISTS "allow_user_signup" ON public.users',
      'DROP POLICY IF EXISTS "allow_user_read_own" ON public.users', 
      'DROP POLICY IF EXISTS "allow_user_update_own" ON public.users',
      
      // Create new correct policies
      'CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id)',
      'CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id)',
      'CREATE POLICY "users_insert_signup" ON public.users FOR INSERT WITH CHECK (true)',
      
      // Ensure RLS is enabled
      'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY'
    ]
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`🔧 Executing command ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`)
      
      try {
        // Try using the rpc function (if available)
        const { error } = await supabaseService.rpc('exec_sql', { sql: command })
        
        if (error) {
          console.log(`⚠️  RPC failed, error:`, error.message)
          // RPC method not available, that's expected
        } else {
          console.log('✅ Command executed successfully via RPC')
          continue
        }
      } catch (e) {
        // RPC not available, continue to next method
      }
      
      // Alternative: try via REST API with raw query
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ sql: command })
        })
        
        if (response.ok) {
          console.log('✅ Command executed successfully via REST')
        } else {
          console.log(`⚠️  REST failed with status:`, response.status)
        }
      } catch (e) {
        console.log(`⚠️  REST method failed:`, e.message)
      }
    }
    
    console.log('\n🔍 Testing the fix...')
    
    // Test that we can now read user data after login
    const testEmail = `test-rls-${Date.now()}@example.com`
    const testPassword = 'testpass123'
    
    // Create test user
    const { data: signupData, error: signupError } = await supabaseService.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (signupError) {
      console.error('❌ Test user creation failed:', signupError.message)
      return
    }
    
    // Create user profile
    await supabaseService.from('users').insert({
      id: signupData.user.id,
      email: testEmail,
      role_id: 2
    })
    
    // Test login and profile read
    const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: loginData, error: loginError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.error('❌ Test login failed:', loginError.message)
      return
    }
    
    // Test profile read
    const { data: profileData, error: profileError } = await regularClient
      .from('users')
      .select('id, email, role_id')
      .eq('id', loginData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile read still fails:', profileError.message)
      console.log('⚠️  RLS policies may not have been applied correctly')
    } else {
      console.log('✅ Profile read successful!', profileData)
      console.log('🎉 RLS fix appears to be working!')
    }
    
    // Cleanup
    await supabaseService.from('users').delete().eq('id', signupData.user.id)
    await supabaseService.auth.admin.deleteUser(signupData.user.id)
    
  } catch (error) {
    console.error('❌ RLS fix failed:', error.message)
  }
}

fixUsersRLS() 