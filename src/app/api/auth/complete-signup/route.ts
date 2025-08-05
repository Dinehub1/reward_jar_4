import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'

// Create a server client for user operations
async function getSupabaseServiceRole() {
  return await createServerClient()
}

interface SignupData {
  userId: string
  email: string
  businessName?: string
  contactNumber?: string
  storeNumbers?: string
}

export async function POST(request: NextRequest) {
  try {
    const data: SignupData = await request.json()

    console.log('=== API COMPLETE SIGNUP START ===')
    console.log('User ID:', data.userId)
    console.log('Email:', data.email)
    console.log('Business Name:', data.businessName)

    // Validate required fields
    if (!data.userId || !data.email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.userId)) {
      console.error('Invalid UUID format:', data.userId)
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    console.log('✅ UUID validation passed')

    // Step 1: Check if user already exists
    console.log('Step 1: Checking if user already exists...')
    const supabase = await getSupabaseServiceRole()
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('id', data.userId)
      .single()

    if (checkUserError && checkUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkUserError)
      return NextResponse.json(
        { error: `Database error: ${checkUserError.message}` },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('User already exists:', existingUser)
    } else {
      // Create user profile
      console.log('Step 2: Creating user profile...')
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.userId,
          email: data.email,
          role_id: 2 // BUSINESS role
        })

      if (userError) {
        console.error('User creation error:', userError)
        console.error('Error code:', userError.code)
        console.error('Error details:', userError.details)
        console.error('Error hint:', userError.hint)
        
        return NextResponse.json(
          { 
            error: `Failed to create user profile: ${userError.message}`,
            code: userError.code,
            details: userError.details
          },
          { status: 500 }
        )
      }
      console.log('✅ User profile created successfully')
    }

    // Step 3: Check if business already exists
    console.log('Step 3: Checking if business already exists...')
    const { data: existingBusiness, error: checkBusinessError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('owner_id', data.userId)
      .single()

    if (checkBusinessError && checkBusinessError.code !== 'PGRST116') {
      console.error('Error checking existing business:', checkBusinessError)
      return NextResponse.json(
        { error: `Database error: ${checkBusinessError.message}` },
        { status: 500 }
      )
    }

    if (existingBusiness) {
      console.log('Business already exists:', existingBusiness)
    } else {
      // Create business profile
      console.log('Step 4: Creating business profile...')
      const businessData = {
        name: data.businessName || data.email.split('@')[0],
        description: null,
        contact_email: data.email,
        owner_id: data.userId,
        status: 'active' as const
      }

      console.log('Business data to insert:', businessData)

      const { error: businessError } = await supabase
        .from('businesses')
        .insert(businessData)

      if (businessError) {
        console.error('Business creation error:', businessError)
        console.error('Error code:', businessError.code)
        console.error('Error details:', businessError.details)
        console.error('Error hint:', businessError.hint)
        
        return NextResponse.json(
          { 
            error: `Failed to create business profile: ${businessError.message}`,
            code: businessError.code,
            details: businessError.details
          },
          { status: 500 }
        )
      }
      console.log('✅ Business profile created successfully')
    }

    console.log('=== API COMPLETE SIGNUP SUCCESS ===')

    return NextResponse.json({
      success: true,
      message: 'User profile and business created successfully',
      userId: data.userId,
      userExists: !!existingUser,
      businessExists: !!existingBusiness
    })

  } catch (error) {
    console.error('Complete signup API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 