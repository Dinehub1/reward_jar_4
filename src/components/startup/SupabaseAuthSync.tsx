'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * ⚡ OPTIMIZED AUTH SYNC
 * 
 * Sync Supabase auth state to server cookies ONLY when necessary
 * Prevents excessive callback requests by debouncing and filtering events
 */
export default function SupabaseAuthSync() {
  const lastEventRef = useRef<string | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    const syncAuthState = (event: string, session: any) => {
      // Clear existing debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Skip redundant events
      if (lastEventRef.current === event && event === 'TOKEN_REFRESHED') {
        return
      }

      // Only sync on meaningful auth changes
      const shouldSync = [
        'SIGNED_IN',
        'SIGNED_OUT',
        'TOKEN_REFRESHED'
      ].includes(event)

      if (!shouldSync) {
        return
      }

      // Debounce rapid token refresh events and limit redundant calls
      debounceTimeoutRef.current = setTimeout(() => {
        // Additional redundancy check
        if (lastEventRef.current === event && event === 'TOKEN_REFRESHED') {
          return // Skip redundant token refresh
        }

        fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ event, session })
        }).catch(() => {
          // Silent fail - don't spam console
        })
        
        lastEventRef.current = event
      }, event === 'TOKEN_REFRESHED' ? 2000 : event === 'SIGNED_IN' ? 0 : 500) // 2s debounce for token refresh, immediate for sign-in, 500ms for others
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(syncAuthState)
    
    return () => {
      subscription.unsubscribe()
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])
  
  return null
}

