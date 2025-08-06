import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/businesses
 * 
 * Fetches all businesses for admin management
 */
export async function GET(request: NextRequest) {
  try {
    // Use server client to authenticate the user
    const supabase = await createServerClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Admin API: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Admin API: Access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Fetch all businesses with card counts using admin client (bypasses RLS for full access)
    const { data: businesses, error } = await adminClient
      .from('businesses')
      .select(`
        id,
        name,
        description,
        contact_email,
        owner_id,
        status,
        logo_url,
        is_flagged,
        admin_notes,
        card_requested,
        created_at,
        updated_at,
        stamp_cards(id, status),
        membership_cards(id, status)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Admin API: Error fetching businesses:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch businesses' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    // Process businesses to add card counts
    const businessesWithCounts = (businesses || []).map(business => {
      const stampCards = business.stamp_cards || []
      const membershipCards = business.membership_cards || []
      
      const totalCards = stampCards.length + membershipCards.length
      const activeCards = stampCards.filter(card => card.status === 'active').length + 
                         membershipCards.filter(card => card.status === 'active').length
      
      return {
        ...business,
        total_cards: totalCards,
        active_cards: activeCards,
        // Remove the nested arrays from the response to keep it clean
        stamp_cards: undefined,
        membership_cards: undefined
      }
    })

    console.log('✅ Admin API: Fetched businesses with card counts successfully:', businessesWithCounts?.length)

    return NextResponse.json({
      success: true,
      data: businessesWithCounts,
      message: 'Businesses fetched successfully'
    } as ApiResponse<typeof businessesWithCounts>)

  } catch (error) {
    console.error('❌ Admin API: Error in businesses fetch:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/businesses
 * 
 * Creates a new business via admin interface
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      name,
      description,
      contact_email,
      owner_id,
      status = 'active',
      card_requested = false,
      logo_url
    } = body

    console.log('🔍 Admin API: Creating business:', { name, contact_email, owner_id })

    // Use server client to authenticate the user
    const supabase = await createServerClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Admin API: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Admin API: Access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Validate required fields
    if (!name || !contact_email) {
      return NextResponse.json(
        { success: false, error: 'Business name and contact email are required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Check if business with same email already exists using admin client
    const { data: existingBusiness } = await adminClient
      .from('businesses')
      .select('id, name')
      .eq('contact_email', contact_email)
      .single()

    if (existingBusiness) {
      return NextResponse.json(
        { success: false, error: 'Business with this email already exists' } as ApiResponse<never>,
        { status: 409 }
      )
    }

    // Create the business using admin client (bypasses RLS)
    const businessPayload = {
      name,
      description: description || '',
      contact_email,
      owner_id: owner_id || user.id, // Default to admin user if no owner specified
      status,
      card_requested,
      logo_url: logo_url || null,
      is_flagged: false,
      admin_notes: `Created by admin ${user.email} on ${new Date().toISOString()}`
    }

    const { data: savedBusiness, error } = await adminClient
      .from('businesses')
      .insert([businessPayload])
      .select()
      .single()

    if (error) {
      console.error('❌ Admin API: Error saving business:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save business: ' + error.message } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ Admin API: Business saved successfully:', savedBusiness)

    return NextResponse.json({
      success: true,
      data: savedBusiness,
      message: 'Business created successfully'
    } as ApiResponse<typeof savedBusiness>)

  } catch (error) {
    console.error('❌ Admin API: Error in business creation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}