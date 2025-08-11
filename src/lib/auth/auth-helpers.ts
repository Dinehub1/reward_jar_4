import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * Enhanced auth helpers for production-ready authentication
 */

export interface UserWithRole {
  id: string
  email: string
  role_id: number
  role_name?: string
}

/**
 * Get user role from JWT claims (primary method)
 * Falls back to database if not present in claims
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

    // Fallback: Query database (with caching)
    return await getUserRoleFromDatabase(user.id)
  } catch (error) {
    console.error('Error getting user role:', error)
    return 0 // Default to no role
  }
}

/**
 * Database role lookup with error handling, performance logging, and timeout
 */
export async function getUserRoleFromDatabase(userId: string, timeoutMs: number = 3000): Promise<number> {
  const startTime = Date.now()
  
  try {
    const supabase = createAdminClient()
    
    // Add timeout to prevent hanging
    const queryPromise = supabase
      .from('users')
      .select('role_id')
      .eq('id', userId)
      .single()

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Role lookup timeout')), timeoutMs)
    })

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

    const queryTime = Date.now() - startTime
    
    if (queryTime > 1000) {
      console.warn(`[AUTH-PERF] Slow role lookup: ${queryTime}ms for user ${userId}`)
    }

    if (error) {
      console.error('[AUTH-ERROR] Role lookup failed:', error)
      return 0
    }

    return data?.role_id || 0
  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error(`[AUTH-ERROR] Role lookup exception after ${queryTime}ms:`, error)
    
    // Return a safe default rather than blocking login
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