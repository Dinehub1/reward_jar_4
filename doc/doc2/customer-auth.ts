/**
 * RewardJar 4.0 - Customer Authentication Logic
 * Email-based signup/login with Supabase OTP integration
 * 
 * @version 4.0
 * @author RewardJar Development Team
 * @created July 21, 2025
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Initialize Supabase client
const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types for authentication
interface SignupRequest {
  email: string
  password: string
  name?: string
}

interface LoginRequest {
  email: string
  password?: string
  otp?: string
}

interface AuthResponse {
  success: boolean
  message: string
  user?: any
  token?: string
  requiresOTP?: boolean
}

interface CustomerProfile {
  id: string
  user_id: string
  name: string
  email: string
  role_id: number
  created_at: string
}

/**
 * Customer Signup with Email OTP Verification
 * POST /api/customer/signup
 */
export async function customerSignup(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SignupRequest = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid email address'
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Account already exists, please login'
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.BASE_URL}/customer/verify-email`,
        data: {
          role: 'customer',
          name: name || ''
        }
      }
    })

    if (authError) {
      console.error('Supabase auth signup error:', authError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create account. Please try again.'
      }, { status: 500 })
    }

    // Create user record in users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id,
        email,
        role_id: 3, // Customer role
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('User record creation error:', userError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create user profile'
      }, { status: 500 })
    }

    // Create customer profile
    const { data: customerProfile, error: profileError } = await supabase
      .from('customers')
      .insert({
        user_id: authUser.user!.id,
        name: name || email.split('@')[0],
        email,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Customer profile creation error:', profileError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create customer profile'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresOTP: true,
      user: {
        id: authUser.user!.id,
        email,
        role_id: 3, // Customer role with access to /test/wallet-preview for loyalty card testing (stamp & membership subtypes)
        profile: customerProfile
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Customer signup error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Customer Login with Email/Password
 * POST /api/customer/login
 */
export async function customerLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    // Get user profile with customer data
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role_id,
        created_at,
        customers (
          id,
          name,
          email,
          created_at
        )
      `)
      .eq('id', authData.user.id)
      .eq('role_id', 3) // Ensure customer role
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({
        success: false,
        message: 'Customer profile not found'
      }, { status: 404 })
    }

    // Generate JWT token for API access
    const tokenPayload = {
      userId: authData.user.id,
      email: authData.user.email,
      role_id: 3,
      customerId: (userProfile.customers as any)?.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback-secret')

    // Update last login
    await supabase
      .from('customers')
      .update({ 
        last_login: new Date().toISOString()
      })
      .eq('user_id', authData.user.id)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role_id: 3,
        profile: userProfile.customers
      },
      token,
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Customer login error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * OTP Verification for Email Confirmation
 * POST /api/customer/verify-otp
 */
export async function verifyCustomerOTP(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Validate input
    if (!email || !otp) {
      return NextResponse.json({
        success: false,
        message: 'Email and OTP are required'
      }, { status: 400 })
    }

    // Verify OTP with Supabase
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    })

    if (verifyError || !authData.user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid verification code, please try again'
      }, { status: 400 })
    }

    // Get customer profile
    const { data: customerProfile, error: profileError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Customer profile fetch error:', profileError)
      return NextResponse.json({
        success: false,
        message: 'Customer profile not found'
      }, { status: 404 })
    }

    // Generate JWT token
    const tokenPayload = {
      userId: authData.user.id,
      email: authData.user.email,
      role_id: 3,
      customerId: customerProfile.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback-secret')

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role_id: 3,
        profile: customerProfile
      },
      token,
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at
      }
    }, { status: 200 })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Session Management - Refresh Token
 * POST /api/customer/refresh-session
 */
export async function refreshCustomerSession(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json({
        success: false,
        message: 'Refresh token is required'
      }, { status: 400 })
    }

    // Refresh session with Supabase
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (refreshError || !sessionData.user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired refresh token'
      }, { status: 401 })
    }

    // Generate new JWT token
    const { data: customerProfile } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', sessionData.user.id)
      .single()

    const tokenPayload = {
      userId: sessionData.user.id,
      email: sessionData.user.email,
      role_id: 3,
      customerId: customerProfile?.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback-secret')

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      token,
      session: {
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
        expires_at: sessionData.session?.expires_at
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Customer Logout
 * POST /api/customer/logout
 */
export async function customerLogout(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Verify token to get user info
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        
        // Sign out from Supabase
        await supabase.auth.signOut()
        
        // Update last logout time
        await supabase
          .from('customers')
          .update({ 
            last_logout: new Date().toISOString()
          })
          .eq('id', decoded.customerId)
          
      } catch (tokenError) {
        console.warn('Token verification failed during logout:', tokenError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Customer logout error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Middleware for Customer Authentication
 */
export function authenticateCustomer(request: NextRequest): { success: boolean; user?: any; error?: string } {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return {
        success: false,
        error: 'Authentication token is required'
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any

    // Verify customer role
    if (decoded.role_id !== 3) {
      return {
        success: false,
        error: 'Invalid customer credentials'
      }
    }

    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return {
        success: false,
        error: 'Token has expired, please login again'
      }
    }

    return {
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        customerId: decoded.customerId,
        role_id: decoded.role_id
      }
    }

  } catch (error) {
    console.error('Authentication middleware error:', error)
    return {
      success: false,
      error: 'Invalid authentication token'
    }
  }
}

/**
 * Guest Access Handler for QR Scans
 */
export async function handleGuestAccess(cardId: string): Promise<{
  success: boolean
  cardPreview?: any
  loginRequired?: boolean
  message?: string
}> {
  try {
    // Get card preview data without authentication
    const { data: cardData, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            name,
            description
          )
        )
      `)
      .eq('id', cardId)
      .single()

    if (error || !cardData) {
      return {
        success: false,
        message: 'Card not found'
      }
    }

    return {
      success: true,
      loginRequired: true,
      cardPreview: {
        cardName: (cardData.stamp_cards as any).name,
        businessName: (cardData.stamp_cards as any).businesses.name,
        cardType: cardData.membership_type, // Support both loyalty subtypes (stamp & membership)
        progress: cardData.membership_type === 'loyalty' 
          ? `${cardData.current_stamps}/${(cardData.stamp_cards as any).total_stamps} stamps`
          : `${cardData.sessions_used}/${cardData.total_sessions} sessions`
      },
      message: 'Please login to collect stamps and earn rewards'
    }

  } catch (error) {
    console.error('Guest access error:', error)
    return {
      success: false,
      message: 'Unable to load card preview'
    }
  }
}

// Export all functions for API routes
export {
  customerSignup,
  customerLogin,
  verifyCustomerOTP,
  refreshCustomerSession,
  customerLogout,
  authenticateCustomer,
  handleGuestAccess
} 