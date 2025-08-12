import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'

/**
 * POST /api/auth/get-role
 * 
 * Secure API endpoint to get user role after authentication.
 * This endpoint validates the user's access token and returns their role.
 * 
 * SECURITY: Uses createAdminClient() server-side only.
 * The client sends their access token, we validate it and return role data.
 */

export interface GetRoleRequest {
  accessToken: string
}

export interface GetRoleResponse {
  success: boolean
  role?: number
  userId?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GetRoleResponse>> {
  const startTime = Date.now()
  
  try {
    const body: GetRoleRequest = await request.json()
    
    if (!body.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Access token is required'
      }, { status: 400 })
    }

    // Fast token validation without session creation
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser(body.accessToken)
    
    if (userError || !user) {
      console.error('[AUTH-API] Token validation failed:', userError?.message)
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired access token'
      }, { status: 401 })
    }

    // Now safely use admin client to get role (server-side only)
    const adminClient = createAdminClient()
    console.log('[AUTH-API] Getting role for validated user:', user.id)
    
    const queryStartTime = Date.now()
    
    // Query with timeout protection
    const { data: userData, error: roleError } = await Promise.race([
      adminClient
        .from('users')
        .select('role_id')
        .eq('id', user.id)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role lookup timeout')), 3000)
      )
    ]) as any

    const queryTime = Date.now() - queryStartTime
    console.log('[AUTH-API] Role lookup completed in', queryTime, 'ms')

    if (roleError) {
      console.error('[AUTH-API] Role lookup error:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve user role'
      }, { status: 500 })
    }

    const role = userData?.role_id || 0
    console.log('[AUTH-API] Role resolved:', role, 'for user:', user.id)

    // Performance warning for slow queries
    if (queryTime > 1000) {
      console.warn(`[AUTH-API] SLOW ROLE LOOKUP: ${queryTime}ms for user ${user.id}`)
    }

    const totalTime = Date.now() - startTime
    console.log(`[AUTH-API] Complete auth flow: ${totalTime}ms (query: ${queryTime}ms)`)

    return NextResponse.json({
      success: true,
      role,
      userId: user.id
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Response-Time': `${totalTime}ms`
      }
    })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error(`[AUTH-API] Error after ${totalTime}ms:`, error)
    return NextResponse.json({
      success: false,
      error: error.message === 'Role lookup timeout' 
        ? 'Role lookup took too long - please try again'
        : 'Internal server error'
    }, { status: 500 })
  }
}