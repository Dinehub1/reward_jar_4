import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * 🖥️ CENTRALIZED SERVER-SIDE SUPABASE CLIENT 🖥️
 * 
 * This is the ONLY way to create Supabase clients in server-side code:
 * - API routes (route.ts files)
 * - Server Components 
 * - Server Actions
 * 
 * ⚠️ CRITICAL RULES:
 * - NEVER use createClient() in server-side code
 * - ALWAYS use this helper for server-side operations
 * - Use createAdminClient() for admin operations that bypass RLS
 * - Use createAuthClient() for client-side authentication only
 */

/**
 * Create server-side Supabase client with user context (respects RLS)
 * Use this for operations that need user authentication and RLS
 */
export async function createServerClient(): Promise<ReturnType<typeof createSupabaseServerClient<Database>>> {
  try {
    const cookieStore = await cookies()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !anonKey) {
      throw new Error('🚨 SERVER CLIENT ERROR: Missing Supabase environment variables')
    }
    
    return createSupabaseServerClient<Database>(
      supabaseUrl,
      anonKey,
      {
        cookies: {
          get(name: string) {
            try {
              return cookieStore.get(name)?.value
            } catch (error) {
              return undefined
            }
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name)
            } catch (error) {
            }
          },
        },
        global: {
          headers: {
            'x-client-info': 'rewardjar-server',
            'x-server-context': 'true'
          }
        }
      }
    )
  } catch (error) {
    throw error
  }
}

// Deprecated function removed - use createServerClient() directly

/**
 * Get authenticated user from server context
 * Safe wrapper around auth.getUser() with proper error handling
 */
export async function getServerUser() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { user: null, error }
    }
    
    return { user, error: null }
  } catch (error) {
    return { user: null, error: error instanceof Error ? error : new Error('Unknown error') }
  }
}

/**
 * Get user session from server context
 * Safe wrapper around auth.getSession() with proper error handling
 */
export async function getServerSession() {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { session: null, error }
    }
    
    return { session, error: null }
  } catch (error) {
    return { session: null, error: error instanceof Error ? error : new Error('Unknown error') }
  }
}