import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * ⚠️ SERVER-ONLY SUPABASE CLIENT ⚠️
 * 
 * This file provides a Supabase client specifically for server-side operations:
 * - API routes (route.ts files)
 * - Server Components (async components without 'use client')
 * - Server Actions
 * 
 * DO NOT IMPORT THIS IN CLIENT COMPONENTS!
 * Use @/lib/supabase/client instead for client-side operations.
 */

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )
}

export default createClient 