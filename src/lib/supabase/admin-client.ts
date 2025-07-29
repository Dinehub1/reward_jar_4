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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export default createAdminClient 