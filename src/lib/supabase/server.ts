import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side operations
 * This should only be used in:
 * - API routes (/app/api/*)
 * - Server components (page.tsx, layout.tsx)
 * - Server actions
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      db: { schema: 'public' },
      global: {
        headers: { 'x-timeout': '15000' }  // 15s timeout
      }
    }
  )
}

/**
 * Creates a Supabase service role client for admin operations
 * This bypasses RLS policies and should only be used for:
 * - User creation during signup
 * - Admin operations
 * - System-level queries
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for service role client
        },
      },
      db: { schema: 'public' },
      global: {
        headers: { 'x-timeout': '15000' }  // 15s timeout
      }
    }
  )
} 