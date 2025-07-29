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
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  // Use service role key if available, otherwise fall back to anon key
  const apiKey = serviceRoleKey || anonKey
  
  if (!apiKey) {
    throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  
  if (!serviceRoleKey) {
    console.warn('⚠️ SERVER-ONLY CLIENT - Using anon key (limited access)')
  }
  
  return createServerClient(
    supabaseUrl,
    apiKey,
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