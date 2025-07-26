import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export interface User {
  id: string
  email: string
  role_id: number
}

export interface AuthResult {
  user: User | null
  isAuthenticated: boolean
  isBusiness: boolean
  isCustomer: boolean
}

/**
 * Check authentication and get user role (CLIENT-SIDE VERSION)
 * This version works in client components and uses fetch to call our API
 */
export async function checkAuth(): Promise<AuthResult> {
  try {
    // Use our auth status API which handles server-side logic
    const response = await fetch('/api/auth/status')
    
    if (!response.ok) {
      return {
        user: null,
        isAuthenticated: false,
        isBusiness: false,
        isCustomer: false
      }
    }
    
    const result = await response.json()
    
    // Handle new API response format
    const isAuthenticated = result.authenticated || false
    const userRole = result.role
    const user = result.user ? {
      ...result.user,
      role_id: userRole
    } : null
    
    return {
      user: user,
      isAuthenticated: isAuthenticated,
      isBusiness: userRole === 2,
      isCustomer: userRole === 3
    }

  } catch (error) {
    console.error('Auth: Check failed:', error)
    return {
      user: null,
      isAuthenticated: false,
      isBusiness: false,
      isCustomer: false
    }
  }
}

/**
 * Require business authentication for protected routes
 * Redirects to login if not authenticated or not a business user
 */
export async function requireBusinessAuth(): Promise<User> {
  const auth = await checkAuth()
  
  if (!auth.isAuthenticated) {
    redirect('/auth/login?error=unauthorized')
  }
  
  if (!auth.isBusiness) {
    redirect('/auth/login?error=insufficient_permissions')
  }
  
  return auth.user!
}

/**
 * Require customer authentication for protected routes
 * Redirects to login if not authenticated or not a customer
 */
export async function requireCustomerAuth(): Promise<User> {
  const auth = await checkAuth()
  
  if (!auth.isAuthenticated) {
    redirect('/auth/login?error=unauthorized')
  }
  
  if (!auth.isCustomer) {
    redirect('/auth/login?error=insufficient_permissions')
  }
  
  return auth.user!
}

/**
 * Get authentication status without redirecting
 * Useful for API routes and conditional rendering
 */
export async function getAuthStatus(): Promise<AuthResult> {
  return await checkAuth()
}

/**
 * Sign out user and clear session
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
} 