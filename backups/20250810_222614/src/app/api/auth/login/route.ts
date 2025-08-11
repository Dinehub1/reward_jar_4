import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * POST /api/auth/login
 * 
 * Server-side login endpoint for admin authentication
 * Used by admin tools and testing utilities
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse<null>, { status: 400 })
    }

    console.log('🔐 LOGIN API - Attempting login for:', email)

    const supabase = await createServerClient()
    
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('🔐 LOGIN API - Auth error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      } as ApiResponse<null>, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: 'Login failed - no user returned'
      } as ApiResponse<null>, { status: 401 })
    }

    console.log('🔐 LOGIN API - Login successful for user:', data.user.id)

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', data.user.id)
      .single()

    const userRole = userData?.role_id || 3 // Default to customer
    const isAdmin = userRole === 1

    console.log('🔐 LOGIN API - User role:', userRole, 'isAdmin:', isAdmin)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          role_id: userRole,
          isAdmin
        },
        session: data.session
      },
      message: isAdmin ? 'Admin login successful' : 'Login successful'
    } as ApiResponse<{
      user: {
        id: string
        email: string | undefined
        role_id: number
        isAdmin: boolean
      }
      session: any
    }>)

  } catch (error) {
    console.error('🔐 LOGIN API - Server error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>, { status: 500 })
  }
}