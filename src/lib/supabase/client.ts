import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side operations
 * This should only be used in:
 * - Client components (with 'use client' directive)
 * - Browser-side JavaScript
 * - React hooks and effects
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'public' },
      auth: { 
        autoRefreshToken: true,
        persistSession: true  // Changed to true for better session persistence
      },
      global: {
        headers: { 'x-timeout': '15000' }  // 15s timeout
      }
    }
  )
}

// Re-export for backwards compatibility
export default createClient 