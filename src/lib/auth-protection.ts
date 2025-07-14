import { createClient } from '@/lib/supabase'
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
 * Check authentication and get user role
 * Returns authentication status and user info
 */
export async function checkAuth(): Promise<AuthResult> {
  const supabase = createClient()
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return {
        user: null,
        isAuthenticated: false,
        isBusiness: false,
        isCustomer: false
      }
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      // If user doesn't exist in users table, sign them out
      await supabase.auth.signOut()
      return {
        user: null,
        isAuthenticated: false,
        isBusiness: false,
        isCustomer: false
      }
    }

    return {
      user: userData,
      isAuthenticated: true,
      isBusiness: userData.role_id === 2,
      isCustomer: userData.role_id === 3
    }

  } catch (error) {
    console.error('Auth check error:', error)
    return {
      user: null,
      isAuthenticated: false,
      isBusiness: false,
      isCustomer: false
    }
  }
}

/**
 * Protect route for business users only
 * Redirects to login if not authenticated or not a business user
 */
export async function requireBusinessAuth(redirectTo?: string): Promise<User> {
  const auth = await checkAuth()
  
  if (!auth.isAuthenticated) {
    const loginUrl = redirectTo 
      ? `/auth/login?next=${encodeURIComponent(redirectTo)}`
      : '/auth/login'
    redirect(loginUrl)
  }
  
  if (!auth.isBusiness) {
    redirect('/auth/login?error=unauthorized')
  }
  
  return auth.user!
}

/**
 * Protect route for customer users only
 * Redirects to customer-specific login if not authenticated or not a customer
 */
export async function requireCustomerAuth(redirectTo?: string): Promise<User> {
  const auth = await checkAuth()
  
  if (!auth.isAuthenticated) {
    const loginUrl = redirectTo 
      ? `/auth/login?next=${encodeURIComponent(redirectTo)}&role=customer`
      : '/auth/login?role=customer'
    redirect(loginUrl)
  }
  
  if (!auth.isCustomer) {
    redirect('/auth/login?role=customer&error=unauthorized')
  }
  
  return auth.user!
}

/**
 * Get auth status for client components
 * This is for use in client components where we can't use server-side redirects
 */
export async function getAuthStatus(): Promise<AuthResult> {
  return await checkAuth()
}

/**
 * Sign out and redirect to home page
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
  }
  
  redirect('/')
} 