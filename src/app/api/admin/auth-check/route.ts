import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/mcp/auth'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/auth-check
 * 
 * Checks if the current user has admin access
 * Used by AdminLayoutClient for authentication verification
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 ADMIN AUTH CHECK - Using MCP layer for proper role verification')
    
    // Use MCP layer to get authenticated user context
    const authResult = await getAuthContext()
    
    if (!authResult.success || !authResult.data) {
      console.log('❌ ADMIN AUTH CHECK - No authenticated user:', authResult.error)
      return NextResponse.json({
        success: true,
        data: { isAdmin: false },
        message: authResult.error || 'No active session'
      } as ApiResponse<{ isAdmin: boolean }>)
    }

    // Check if user has admin role (role_id === 1)
    const isAdmin = authResult.data.userRole === 1
    
    console.log('🔍 ADMIN AUTH CHECK - Role verification:', {
      userId: authResult.data.userId,
      userRole: authResult.data.userRole,
      isAdmin
    })

    return NextResponse.json({
      success: true,
      data: { 
        isAdmin,
        user: isAdmin ? {
          id: authResult.data.userId,
          role: authResult.data.userRole
        } : undefined
      },
      message: isAdmin ? 'Admin access verified' : 'Admin access denied'
    } as ApiResponse<{ isAdmin: boolean; user?: any }>)

  } catch (error) {
    console.error('❌ ADMIN AUTH CHECK - Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      data: { isAdmin: false }
    } as ApiResponse<{ isAdmin: boolean }>)
  }
}