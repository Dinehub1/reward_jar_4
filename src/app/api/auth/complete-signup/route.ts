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
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }


    // Step 1: Check if user already exists
    const supabase = await getSupabaseServiceRole()
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('id', data.userId)
      .single()

    if (checkUserError && checkUserError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: `Database error: ${checkUserError.message}` },
        { status: 500 }
      )
    }

    if (existingUser) {
    } else {
      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.userId,
          email: data.email,
          role_id: 2 // BUSINESS role
        })

      if (userError) {
        
        return NextResponse.json(
          { 
            error: `Failed to create user profile: ${userError.message}`,
            code: userError.code,
            details: userError.details
          },
          { status: 500 }
        )
      }
    }

    // Step 3: Check if business already exists
    const { data: existingBusiness, error: checkBusinessError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('owner_id', data.userId)
      .single()

    if (checkBusinessError && checkBusinessError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: `Database error: ${checkBusinessError.message}` },
        { status: 500 }
      )
    }

    if (existingBusiness) {
    } else {
      // Create business profile
      const businessData = {
        name: data.businessName || data.email.split('@')[0],
        description: null,
        contact_email: data.email,
        owner_id: data.userId,
        status: 'active' as const
      }


      const { error: businessError } = await supabase
        .from('businesses')
        .insert(businessData)

      if (businessError) {
        
        return NextResponse.json(
          { 
            error: `Failed to create business profile: ${businessError.message}`,
            code: businessError.code,
            details: businessError.details
          },
          { status: 500 }
        )
      }
    }


    return NextResponse.json({
      success: true,
      message: 'User profile and business created successfully',
      userId: data.userId,
      userExists: !!existingUser,
      businessExists: !!existingBusiness
    })

  } catch (error) {
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 