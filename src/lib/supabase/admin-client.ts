import { createClient } from '@supabase/supabase-js'

/**
 * 🔐 ADMIN-ONLY SUPABASE CLIENT 🔐
 * 
 * This client uses the service role key and bypasses RLS to access all system data.
 * ONLY use this in admin contexts where you need to see all businesses, customers, etc.
 * 
 * DO NOT USE IN REGULAR USER CONTEXTS!
 * 
 * Updated for Next.js 15+ compatibility with proper cookie handling.
 */

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for admin client')
  }
  
  if (!serviceRoleKey) {
    console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key (limited access)')
    // Fallback to anon key for development
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!anonKey) {
      throw new Error('Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is available')
    }
    
    return createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export default createAdminClient 