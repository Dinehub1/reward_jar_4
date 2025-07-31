import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/auth/status
 * 
 * Returns the current user's authentication status and role
 * Used by client components to check auth state
 * 
 * NOTE: This endpoint now uses a simpler approach since the server client
 * with cookies() was causing hanging issues. Client-side auth is handled
 * by the client components directly.
 */
export async function GET(request: NextRequest) {
  console.log('🔍 AUTH STATUS - Simplified endpoint (no server-side session)')
  
  try {
    // Extract authorization header if present
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.log('AUTH STATUS - No authorization header')
      return NextResponse.json({
        authenticated: false,
        user: null,
        role: null,
        message: 'No authorization header - use client-side auth'
      })
    }

    // For now, return a simple response that tells the client to handle auth
    // The actual authentication should be done client-side using the auth-protection.ts
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: null,
      message: 'Use client-side authentication - this endpoint is for compatibility only'
    })

  } catch (error) {
    console.error('AUTH STATUS - Error:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      role: null,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 