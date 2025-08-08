import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type RateEntry = { count: number; resetAt: number }

const getStore = () => {
  const g = globalThis as unknown as { __rjRateStore?: Map<string, RateEntry> }
  if (!g.__rjRateStore) g.__rjRateStore = new Map()
  return g.__rjRateStore
}

function getClientKey(req: NextRequest): string {
  const xfwd = req.headers.get('x-forwarded-for') || ''
  const ip = xfwd.split(',')[0]?.trim() || (req as any).ip || 'unknown'
  const ua = req.headers.get('user-agent') || 'unknown'
  return `${ip}:${ua}`
}

function isMutation(method: string) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
}

function rateLimit(key: string, limit: number, windowMs: number) {
  const store = getStore()
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  store.set(key, entry)
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

function ensureCsrf(req: NextRequest) {
  // For mutation methods, require header token to match cookie
  const tokenHeader = req.headers.get('x-csrf-token')
  const cookieToken = req.cookies.get('csrf_token')?.value
  return tokenHeader && cookieToken && tokenHeader === cookieToken
}

function setCsrfIfMissing(req: NextRequest, res: NextResponse) {
  if (!req.cookies.get('csrf_token')) {
    const token = crypto.randomUUID()
    res.cookies.set('csrf_token', token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' })
  }
}

export function middleware(req: NextRequest) {
  // Only enforce in production to avoid local friction
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api/admin')) return NextResponse.next()

  // Basic per-IP+UA rate limiting
  const key = `admin:${isMutation(req.method) ? 'mut' : 'read'}:${getClientKey(req)}`
  const limit = isMutation(req.method) ? 60 : 300 // window limit
  const windowMs = 10 * 60 * 1000 // 10 minutes
  const rl = rateLimit(key, limit, windowMs)
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', String(limit))
  headers.set('X-RateLimit-Remaining', String(rl.remaining))
  headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))

  if (!rl.allowed) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
      { status: 429, headers, headersSent: false }
    )
  }

  // CSRF for mutations
  if (isMutation(req.method)) {
    if (!ensureCsrf(req)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'CSRF token missing or invalid' }),
        { status: 403, headers }
      )
    }
    return NextResponse.next({ headers })
  }

  // For non-mutations, set csrf cookie if missing
  const res = NextResponse.next({ headers })
  setCsrfIfMissing(req, res)
  return res
}

export const config = {
  matcher: ['/api/admin/:path*'],
}

