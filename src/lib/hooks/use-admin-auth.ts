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
  
  // Prevent multiple simultaneous auth checks - RESET on each instance
  const authCheckInProgress = useRef(false)
  const authResolved = useRef(false)
  
  console.log('🔧 AUTH HOOK - New instance created:', { requireAuth, authResolved: authResolved.current })

  const checkAuth = async () => {
    console.log('🔍 AUTH HOOK - checkAuth called:', { 
      authResolved: authResolved.current, 
      authCheckInProgress: authCheckInProgress.current,
      requireAuth 
    })
    
    // If auth is already resolved or in progress, don't check again
    if (authResolved.current || authCheckInProgress.current) {
      console.log('🔍 AUTH HOOK - Skipping auth check (already resolved or in progress)', {
        authResolved: authResolved.current,
        authCheckInProgress: authCheckInProgress.current
      })
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
    console.log('🔍 AUTH HOOK - Starting auth check...')

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
          await new Promise(resolve => setTimeout(resolve, 200 + attempts * 100))
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
      console.log('🔍 AUTH HOOK - API Result:', result)

      if (!result.success) {
        console.log('🚨 AUTH HOOK - API Result not successful:', result.error)
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
      
      console.log('✅ AUTH HOOK - Setting final auth state:', newState)
      console.log('🎯 AUTH SUCCESS - User authenticated as admin, resolving auth state')
      setState(newState)
      authResolved.current = true

    } catch (error) {
      console.error('Auth check error:', error)
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
      console.error('Sign out error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }))
    }
  }

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout
    
    const performAuthCheck = async () => {
      console.log('🔍 AUTH HOOK - performAuthCheck called:', { 
        authResolved: authResolved.current,
        isMounted,
        requireAuth
      })
      
      // Only perform auth check once per component lifecycle
      if (authResolved.current) {
        console.log('🔍 AUTH HOOK - Auth already resolved, skipping')
        return
      }
      
      try {
        console.log('🔍 AUTH HOOK - About to call checkAuth()...')
        await checkAuth()
        console.log('🔍 AUTH HOOK - checkAuth() completed')
      } catch (error) {
        console.error('🚨 AUTH HOOK - performAuthCheck error:', error)
      }
      
      // Only update state if component is still mounted
      if (!isMounted) return
    }
    
    console.log('🔍 AUTH HOOK - useEffect triggered, starting performAuthCheck')
    
    // Use immediate execution with a small delay to ensure the component is mounted
    timeoutId = setTimeout(() => {
      if (isMounted) {
        performAuthCheck()
      }
    }, 10)

    // Listen for auth state changes (optimized to reduce API calls)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔍 AUTH HOOK - Auth state change:', { event, hasSession: !!session })
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
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [requireAuth]) // Add dependency to prevent unnecessary re-runs

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