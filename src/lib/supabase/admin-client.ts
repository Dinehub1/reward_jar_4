import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * 🔐 ADMIN-ONLY SUPABASE CLIENT 🔐
 * 
 * This client uses the service role key and bypasses RLS to access all system data.
 * 
 * ⚠️ CRITICAL SECURITY NOTICE:
 * - ONLY use this in API routes under /api/admin/*
 * - NEVER use in client components or browser code
 * - NEVER expose this client to the frontend
 * 
 * ✅ ALLOWED USAGE:
 * - Server-side API routes (/api/admin/*)
 * - Admin data operations
 * - System-wide analytics and reporting
 * - Database maintenance operations
 * 
 * 🚫 FORBIDDEN USAGE:
 * - Client components
 * - Browser JavaScript
 * - Public API endpoints
 * - User-facing operations
 */

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('🚨 ADMIN CLIENT ERROR: NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!serviceRoleKey) {
    // In development, provide helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ADMIN CLIENT ERROR: SUPABASE_SERVICE_ROLE_KEY not found')
      console.error('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
      console.error('📖 See doc/doc2/3_SUPABASE_SETUP.md for setup instructions')
    }
    
    throw new Error('🚨 ADMIN CLIENT ERROR: SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'rewardjar-admin',
        'x-admin-client': 'true'
      },
      // Enhanced fetch configuration with increased timeout
      fetch: (url: RequestInfo | URL, init?: RequestInit) => {
        const enhancedInit: RequestInit = {
          ...init,
          // Increase timeout to 30 seconds for admin operations
          signal: AbortSignal.timeout(30000)
        }
        
        console.log(`🔗 SUPABASE FETCH - URL: ${url}, Timeout: 30s`)
        
        return fetch(url, enhancedInit).catch(error => {
          console.error('🚨 SUPABASE FETCH ERROR:', {
            url: url.toString(),
            error: error.message,
            code: error.code,
            cause: error.cause
          })
          throw error
        })
      }
    }
  })
}

/**
 * Validates that we're in a server-side context before creating admin client
 * This helps prevent accidental usage in client components
 */
export function createSecureAdminClient() {
  // Check if we're in a server context
  if (typeof window !== 'undefined') {
    throw new Error('🚨 SECURITY VIOLATION: Admin client cannot be used in browser/client context')
  }
  
  // Additional check for API routes
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    console.warn('⚠️ Admin client being used outside of Vercel production environment')
  }
  
  return createAdminClient()
}

/**
 * Admin client with additional safety checks for development
 * Use this in development to catch potential security issues early
 */
export function createDevAdminClient() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('createDevAdminClient can only be used in development')
  }
  
  console.log('🧪 DEV ADMIN CLIENT: Creating admin client for development use')
  return createAdminClient()
}

export default createAdminClient 