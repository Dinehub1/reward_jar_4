'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Sync Supabase auth state to server cookies so API routes/server components
 * see the logged-in user without forcing re-login after refresh/navigation.
 */
export default function SupabaseAuthSync() {
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ event, session })
      }).catch(() => {})
    })
    return () => subscription.unsubscribe()
  }, [])
  return null
}

