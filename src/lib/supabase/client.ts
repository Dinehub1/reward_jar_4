import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * 🌐 CLIENT-SIDE SUPABASE CLIENT 🌐
 * 
 * This client is specifically for browser/client-side operations ONLY:
 * - Authentication (login, signup, logout)
 * - Client components with 'use client' directive
 * - Browser-side JavaScript and React hooks
 * 
 * ⚠️ IMPORTANT USAGE RESTRICTIONS:
 * - DO NOT use for data fetching in components
 * - DO NOT use for admin operations
 * - Use API routes + SWR hooks for data instead
 * 
 * ✅ ALLOWED USES:
 * - User authentication flows
 * - Real-time subscriptions
 * - Client-side auth state management
 */

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      db: { schema: 'public' },
      auth: { 
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 
          'x-timeout': '15000',
          'x-client-info': 'rewardjar-client'
        }
      }
    }
  )
}

/**
 * Auth-only helper for components that only need authentication
 * Use this when you only need to check auth status or perform auth operations
 */
export const createAuthClient = () => {
  const client = createClient()
  return {
    auth: client.auth,
    // Prevent accidental data access
    from: () => {
      throw new Error('Data access not allowed from auth client. Use API routes + SWR hooks instead.')
    }
  }
}

// Re-export for backwards compatibility (deprecated)
export default createClient 