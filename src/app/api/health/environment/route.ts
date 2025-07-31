import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentHealth } from '@/lib/startup-validation'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/health/environment
 * 
 * Returns comprehensive environment health status
 * Used for monitoring and debugging environment configuration
 */
export async function GET(request: NextRequest) {
  try {
    const health = getEnvironmentHealth()
    
    return NextResponse.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof health>)
    
  } catch (error) {
    console.error('Environment health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Environment health check failed',
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, { status: 500 })
  }
}