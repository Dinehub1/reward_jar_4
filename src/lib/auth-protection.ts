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
  isAdmin: boolean
  isBusiness: boolean
  isCustomer: boolean
}

/**
 * Check authentication and get user role (CLIENT-SIDE VERSION)
 * Uses direct client-side Supabase calls instead of the hanging API
 */
export async function checkAuth(): Promise<AuthResult> {
  try {
    
    const supabase = createClient()
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isBusiness: false,
        isCustomer: false
      }
    }

    if (!session?.user) {
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isBusiness: false,
        isCustomer: false
      }
    }


    // Get user role from database
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (roleError) {
      // Return authenticated but without role information
      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          role_id: 0
        },
        isAuthenticated: true,
        isAdmin: false,
        isBusiness: false,
        isCustomer: false
      }
    }

    const userRole = userData?.role_id || 0
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        role_id: userRole
      },
      isAuthenticated: true,
      isAdmin: userRole === 1,
      isBusiness: userRole === 2,
      isCustomer: userRole === 3
    }

  } catch (error) {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isBusiness: false,
      isCustomer: false
    }
  }
}

/**
 * Require admin authentication for protected routes
 * Redirects to login if not authenticated or not an admin user
 */
export async function requireAdminAuth(): Promise<User> {
  const auth = await checkAuth()
  
  if (!auth.isAuthenticated) {
    redirect('/auth/login?error=unauthorized')
  }
  
  if (!auth.isAdmin) {
    redirect('/auth/login?error=insufficient_permissions')
  }
  
  return auth.user!
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