/**
 * Admin Authentication Hook
 * 
 * Provides authentication state and methods for admin components.
 * Uses API routes instead of direct Supabase calls for data fetching.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ApiResponse } from '@/lib/supabase/types'

interface AdminAuthState {
  isAdmin: boolean
  isLoading: boolean
  user: { id: string; email: string } | null
  error: string | null
}

interface AdminAuthActions {
  checkAuth: () => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Hook for admin authentication management
 * Separates authentication (client-side) from authorization (API route)
 */
export function useAdminAuth(requireAuth: boolean = true): AdminAuthState & AdminAuthActions {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    user: null,
    error: null
  })
  
  const router = useRouter()
  const supabase = createClient()

  const checkAuth = async () => {
    if (!requireAuth) {
      setState(prev => ({ ...prev, isLoading: false, isAdmin: true }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Proper authentication flow - check session then verify admin role

      // First check if we have a valid session (client-side auth check)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        setState({
          isAdmin: false,
          isLoading: false,
          user: null,
          error: 'Authentication error'
        })
        return
      }

      if (!session) {
        setState({
          isAdmin: false,
          isLoading: false,
          user: null,
          error: null
        })
        return
      }

      // If we have a session, check admin role via API route
      console.log('🔍 useAdminAuth: Checking admin role via API...')
      const response = await fetch('/api/admin/auth-check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('🔍 useAdminAuth: API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔍 useAdminAuth: API error response:', errorText)
        throw new Error(`Auth check failed: ${response.status} - ${errorText}`)
      }

      const result: ApiResponse<{ isAdmin: boolean; user?: any }> = await response.json()
      console.log('🔍 useAdminAuth: API result:', result)

      if (!result.success) {
        setState({
          isAdmin: false,
          isLoading: false,
          user: null,
          error: result.error || 'Authorization failed'
        })
        return
      }

      setState({
        isAdmin: result.data?.isAdmin || false,
        isLoading: false,
        user: result.data?.user || null,
        error: null
      })

    } catch (error) {
      console.error('Auth check error:', error)
      setState({
        isAdmin: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setState({
        isAdmin: false,
        isLoading: false,
        user: null,
        error: null
      })
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }))
    }
  }

  useEffect(() => {
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setState({
            isAdmin: false,
            isLoading: false,
            user: null,
            error: null
          })
        } else if (event === 'SIGNED_IN') {
          // Re-check auth when user signs in
          checkAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [requireAuth])

  return {
    ...state,
    checkAuth,
    signOut
  }
}

/**
 * Simple hook that just checks if user is authenticated (not necessarily admin)
 * For components that only need to know if user is logged in
 */
export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null)
      setIsLoading(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}

export default useAdminAuth