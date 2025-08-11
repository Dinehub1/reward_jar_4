import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * Development-only login endpoint
 * Use this when Supabase email authentication is having issues
 * 
 * SECURITY: Only use in development - remove for production
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Development endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Use admin client to find user by email
    const supabase = createAdminClient()
    
    // Check if user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found. Please check your email.' },
        { status: 404 }
      )
    }

    // For development, we'll create a simple session token
    // In a real app, you'd verify the password properly
    console.log('🔧 DEV LOGIN - User found:', {
      id: userData.id,
      email: userData.email,
      role: userData.role_id
    })

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role_id: userData.role_id
      },
      message: 'Development login successful',
      warning: 'This is a development-only endpoint'
    })

  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}