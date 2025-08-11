/**
 * Admin Authentication Hook
 * 
 * Provides authentication state and methods for admin components.
 * Uses API routes instead of direct Supabase calls for data fetching.
 */

import { useState, useEffect, useRef } from 'react'
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
 * Optimized to prevent infinite polling and excessive API calls
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
  
  // Prevent multiple simultaneous auth checks
  const authCheckInProgress = useRef(false)
  const authResolved = useRef(false)

  const checkAuth = async () => {
      authResolved: authResolved.current, 
      authCheckInProgress: authCheckInProgress.current,
      requireAuth 
    })
    
    // If auth is already resolved or in progress, don't check again
    if (authResolved.current || authCheckInProgress.current) {
      return
    }
    
    if (!requireAuth) {
      setState(prev => ({ ...prev, isLoading: false, isAdmin: true }))
      authResolved.current = true
      return
    }

    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      return
    }
    
    authCheckInProgress.current = true

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Fast path: ask the server first (cookie-based auth is authoritative)
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

      if (result.success && result.data?.isAdmin) {
        const finalUser = result.data.user ? { id: result.data.user.id, email: result.data.user.email || '' } : null
        const newState = { isAdmin: true, isLoading: false, user: finalUser, error: null }
        setState(newState)
        authResolved.current = true
        return
      }

      // Slow path: not admin per server; confirm session presence to finalize
      let session: any = null
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
      }
      session = currentSession
      if (!session) {
        setState({ isAdmin: false, isLoading: false, user: null, error: null })
        authResolved.current = true
        return
      }

      setState({ isAdmin: false, isLoading: false, user: null, error: null })
      authResolved.current = true

    } catch (error) {
      setState({
        isAdmin: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      authResolved.current = true
    } finally {
      authCheckInProgress.current = false
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
      // Reset auth state for future logins
      authResolved.current = false
      authCheckInProgress.current = false
      router.push('/auth/login')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }))
    }
  }

  useEffect(() => {
    let isMounted = true
const timeoutId: NodeJS.Timeout | null = null
    
    const performAuthCheck = async () => {
        authResolved: authResolved.current,
        isMounted 
      })
      
      // Only perform auth check once per component lifecycle
      if (authResolved.current) {
        return
      }
      
      try {
        await checkAuth()
      } catch (error) {
      }
      
      // Only update state if component is still mounted
      if (!isMounted) return
    }
    
    
    // Use immediate execution with a small delay to ensure the component is mounted
    const localTimeoutId = setTimeout(() => {
      if (isMounted) {
        performAuthCheck()
      }
    }, 10)

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
          // Reset for future auth checks
          authResolved.current = false
          authCheckInProgress.current = false
        } else if (event === 'SIGNED_IN' && !authResolved.current) {
          // Re-check auth when user signs in, but only if not already resolved
          performAuthCheck()
        }
        // Don't check auth on every token refresh to reduce API calls
      }
    )

    return () => {
      isMounted = false
      if (localTimeoutId) clearTimeout(localTimeoutId)
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array - run only once

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