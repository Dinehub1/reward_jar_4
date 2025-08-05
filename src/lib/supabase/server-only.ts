import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * 🖥️ SERVER-SIDE SUPABASE CLIENT 🖥️
 * 
 * This client is for server-side operations with user context:
 * - Server Components (async components without 'use client')
 * - Server Actions with user authentication
 * - API routes that need user session context
 * 
 * ⚠️ IMPORTANT DISTINCTIONS:
 * - This client respects RLS (Row Level Security)
 * - Uses user session from cookies
 * - For admin operations, use createAdminClient() instead
 * 
 * ✅ USE FOR:
 * - User-specific data operations
 * - Server components with user context
 * - Authenticated API routes
 * 
 * 🚫 DO NOT USE FOR:
 * - Client components (use client.ts)
 * - Admin operations (use admin-client.ts)
 * - Public data without user context
 */

export async function createServerClient() {
  try {
    const cookieStore = await cookies()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      throw new Error('🚨 SERVER CLIENT ERROR: NEXT_PUBLIC_SUPABASE_URL is required')
    }
    
    if (!anonKey) {
      throw new Error('🚨 SERVER CLIENT ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
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
              console.warn('Failed to get cookie:', name, error)
              return undefined
            }
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
              // Handle cookie setting errors gracefully
              console.warn('Failed to set cookie:', name, error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name)
            } catch (error) {
              // Handle cookie deletion errors gracefully
              console.warn('Failed to remove cookie:', name, error)
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
    console.error('🚨 SERVER CLIENT ERROR: Failed to create server client:', error)
    throw error
  }
}

// Deprecated function removed - use createServerClient() directly

export default createServerClient 