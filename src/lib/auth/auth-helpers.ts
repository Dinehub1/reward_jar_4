/**
 * 🔐 SECURE AUTH HELPERS
 * 
 * These helpers are designed for CLIENT-SIDE use and DO NOT access service role keys.
 * All database operations are handled by secure API endpoints.
 * 
 * SECURITY COMPLIANCE:
 * - No createAdminClient() usage (prevents service role key exposure)
 * - All database queries routed through secure API endpoints
 * - Client-safe role resolution and redirect logic
 */

export interface UserWithRole {
  id: string
  email: string
  role_id: number
  role_name?: string
}

export interface GetRoleRequest {
  accessToken: string
}

export interface GetRoleResponse {
  success: boolean
  role?: number
  userId?: string
  error?: string
}

/**
 * 🔐 SECURE: Get user role via API endpoint
 * This replaces direct database access and is safe for client components
 */
export async function getUserRole(user: any): Promise<number> {
  try {
    // First, try to get role from JWT claims (if available)
    if (user?.app_metadata?.role_id) {
      return parseInt(user.app_metadata.role_id)
    }
    
    if (user?.user_metadata?.role_id) {
      return parseInt(user.user_metadata.role_id)
    }

    // Secure fallback: Call API endpoint (no direct database access)
    return await getUserRoleFromAPI(user)
  } catch (error) {
    console.error('[AUTH-HELPERS] Error getting user role:', error)
    return 0 // Default to no role
  }
}

// Simple in-memory cache for role lookups (client-side only)
const roleCache = new Map<string, { role: number; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * 🔐 SECURE: Get user role directly with access token
 * This is the preferred method for client components after authentication
 * Includes client-side caching for performance
 */
export async function getUserRoleWithToken(accessToken: string): Promise<number> {
  try {
    // Check cache first (client-side performance optimization)
    const cacheKey = accessToken.substring(0, 32) // Use partial token as cache key
    const cached = roleCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[AUTH-HELPERS] Role cache hit - instant response')
      return cached.role
    }

    const startTime = Date.now()
    console.log('[AUTH-HELPERS] Calling secure API for role lookup with token')

    const response = await fetch('/api/auth/get-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Force fresh request to server
      },
      body: JSON.stringify({
        accessToken
      } as GetRoleRequest),
    })

    const result: GetRoleResponse = await response.json()
    const apiTime = Date.now() - startTime
    
    console.log('[AUTH-HELPERS] API role lookup completed in', apiTime, 'ms')

    if (!result.success) {
      console.error('[AUTH-HELPERS] API role lookup failed:', result.error)
      return 0
    }

    const role = result.role || 0
    
    // Cache the result for future requests
    roleCache.set(cacheKey, { role, timestamp: now })
    
    // Clean up old cache entries
    if (roleCache.size > 10) {
      const oldEntries = Array.from(roleCache.entries())
        .filter(([, value]) => (now - value.timestamp) > CACHE_DURATION)
      oldEntries.forEach(([key]) => roleCache.delete(key))
    }

    return role
  } catch (error) {
    console.error('[AUTH-HELPERS] API role lookup exception:', error)
    return 0
  }
}

/**
 * 🔐 SECURE: API-based role lookup (client-safe)
 * Makes secure API call instead of direct database access
 * Note: This tries to extract access token from user object
 */
export async function getUserRoleFromAPI(user: any): Promise<number> {
  try {
    // Try different locations where access token might be stored
    let accessToken = user?.access_token || user?.session?.access_token

    if (!accessToken) {
      console.warn('[AUTH-HELPERS] No access token available for role lookup in user object')
      return 0
    }

    return await getUserRoleWithToken(accessToken)
  } catch (error) {
    console.error('[AUTH-HELPERS] API role lookup exception:', error)
    return 0
  }
}

/**
 * Get role redirect path based on role_id
 */
export function getRoleRedirectPath(roleId: number, fallback: string = '/'): string {
  switch (roleId) {
    case 1: return '/admin'
    case 2: return '/business/dashboard'
    case 3: return '/customer/dashboard'
    default: return fallback
  }
}

/**
 * Validate and normalize role data
 */
export function normalizeRole(roleInput: any): number {
  if (typeof roleInput === 'number') return roleInput
  if (typeof roleInput === 'string') return parseInt(roleInput) || 0
  return 0
}