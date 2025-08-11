import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Minimal cookie sync endpoint for Supabase SSR helpers
export async function POST(request: Request) {
  try {
    const { event, session } = await request.json().catch(() => ({ event: null, session: null }))
    const cookieStore = await cookies()
    // Copy the access token into the same cookie key Supabase SSR uses
    // The library reads/writes multiple keys; we persist the raw token for continuity
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      const accessToken = session?.access_token
      const refreshToken = session?.refresh_token
      if (accessToken) cookieStore.set('sb-access-token', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' })
      if (refreshToken) cookieStore.set('sb-refresh-token', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/' })
    }
    if (event === 'SIGNED_OUT') {
      cookieStore.delete('sb-access-token')
      cookieStore.delete('sb-refresh-token')
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

