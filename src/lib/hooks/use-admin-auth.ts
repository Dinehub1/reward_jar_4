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
 * Optimized to reduce excessive API calls
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
      // Starting auth check

      // First check if we have a valid session (client-side auth check)
      // Add retry logic for session hydration
      let session = null
      let attempts = 0
      const maxAttempts = 3
      
      while (!session && attempts < maxAttempts) {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
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
        
        session = currentSession
        attempts++
        
        // If no session on first attempt, wait briefly for hydration
        if (!session && attempts < maxAttempts) {
          // No session found, waiting for hydration
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      if (!session) {
        // No session found after all attempts
        setState({
          isAdmin: false,
          isLoading: false,
          user: null,
          error: null
        })
        return
      }

      // Session found, checking admin role

      // If we have a session, check admin role via API route
      // Checking admin role via API
      const response = await fetch('/api/admin/auth-check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // API response received

      if (!response.ok) {
        const errorText = await response.text()
        // API error response received
        throw new Error(`Auth check failed: ${response.status} - ${errorText}`)
      }

      const result: ApiResponse<{ isAdmin: boolean; user?: any }> = await response.json()
      // API result processed

      if (!result.success) {
        setState({
          isAdmin: false,
          isLoading: false,
          user: null,
          error: result.error || 'Authorization failed'
        })
        return
      }

      const newState = {
        isAdmin: result.data?.isAdmin || false,
        isLoading: false,
        user: result.data?.user || null,
        error: null
      }
      
      // Setting final auth state
      setState(newState)

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
    let isMounted = true
    
    const performAuthCheck = async () => {
      // Add minimum loading time to prevent flash
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200))
      
      const authCheckPromise = checkAuth()
      
      // Wait for both the auth check and minimum loading time
      await Promise.all([authCheckPromise, minLoadingTime])
      
      // Only update state if component is still mounted
      if (!isMounted) return
    }
    
    performAuthCheck()

    // Listen for auth state changes (optimized to reduce API calls)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        
        if (event === 'SIGNED_OUT' || !session) {
          setState({
            isAdmin: false,
            isLoading: false,
            user: null,
            error: null
          })
        } else if (event === 'SIGNED_IN') {
          // Re-check auth when user signs in
          performAuthCheck()
        }
        // Don't check auth on every token refresh to reduce API calls
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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