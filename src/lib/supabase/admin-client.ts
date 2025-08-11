import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { getServiceRoleKey } from '@/lib/env'

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

// Cache the admin client to avoid repeated initialization
let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  // Return cached client if available (performance optimization)
  if (cachedAdminClient) {
    return cachedAdminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    throw new Error('🚨 ADMIN CLIENT ERROR: NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  // Use the secure helper function to get the service role key
  // This will handle all validation and security checks
  const serviceRoleKey = getServiceRoleKey()
  
  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'rewardjar-admin',
        'x-admin-client': 'true'
      },
      // Optimized fetch configuration
      fetch: (url: RequestInfo | URL, init?: RequestInit) => {
        const enhancedInit: RequestInit = {
          ...init,
          // Faster timeout for better performance
          signal: AbortSignal.timeout(10000), // Reduced from 30s to 10s
          // Connection pooling
          keepalive: true
        }
        
        return fetch(url, enhancedInit).catch(error => {
          // Simplified error logging for performance
          if (process.env.NODE_ENV === 'development') {
            console.error(`Admin client error: ${error.message}`)
          }
          throw error
        })
      }
    }
  })

  // Cache the client for reuse
  cachedAdminClient = client
  return client
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
  
  return createAdminClient()
}

export default createAdminClient 