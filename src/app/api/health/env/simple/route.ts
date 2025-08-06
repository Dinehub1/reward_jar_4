import { NextResponse } from 'next/server'
import { isServiceRoleKeyConfigured } from '@/lib/env'

/**
 * Simple environment check endpoint for admin UI
 * Returns basic status without exposing sensitive information
 */
export async function GET() {
  try {
    const hasServiceRoleKey = isServiceRoleKeyConfigured()
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const criticalMissing = [
      !hasSupabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
      !hasAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
      !hasServiceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY'
    ].filter(Boolean)

    return NextResponse.json({
      status: criticalMissing.length === 0 ? 'healthy' : 'missing_config',
      hasSupabaseUrl,
      hasAnonKey,
      hasServiceRoleKey,
      criticalMissing,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking environment:', error)
    return NextResponse.json({
      status: 'error',
      error: 'Failed to check environment',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}