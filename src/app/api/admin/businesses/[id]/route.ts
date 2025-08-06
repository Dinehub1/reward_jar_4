import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/businesses/[id]
 * 
 * Fetches detailed business information for admin dashboard
 * Uses admin client to bypass RLS for comprehensive business data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    
    console.log('🔍 Admin API: Fetching business details for ID:', businessId)

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
    
    // First, try a simple query to see if the business exists
    const { data: businessCheck, error: checkError } = await adminClient
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (checkError) {
      console.error('❌ Admin API: Error in simple business check:', checkError)
      return NextResponse.json(
        { success: false, error: `Business not found: ${checkError.message}` } as ApiResponse<never>,
        { status: 404 }
      )
    }

    console.log('✅ Admin API: Business found, fetching detailed data...')

    // Fetch related data separately to avoid join issues
    const [
      { data: ownerData },
      { data: stampCards },
      { data: customerCards }
    ] = await Promise.all([
      adminClient.from('users').select('email, created_at').eq('id', businessCheck.owner_id).single(),
      adminClient.from('stamp_cards').select('id, name, status').eq('business_id', businessId),
      adminClient.from('customer_cards').select('id, customer_id, card_type, status').eq('business_id', businessId)
    ])

    // Combine the data
    const business = {
      ...businessCheck,
      users: ownerData,
      stamp_cards: stampCards || [],
      customer_cards: customerCards || []
    }

    console.log('✅ Admin API: Business details fetched successfully:', business.name)

    return NextResponse.json({
      success: true,
      data: business,
      message: 'Business details fetched successfully'
    } as ApiResponse<typeof business>)

  } catch (error) {
    console.error('❌ Admin API: Error in business details fetch:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/businesses/[id]
 * 
 * Updates business information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    const body = await request.json()
    
    const { 
      name,
      description,
      contact_email,
      location,
      website_url,
      status,
      is_flagged,
      admin_notes,
      card_requested,
      logo_url,
      latitude,
      longitude,
      place_id,
      formatted_address
    } = body

    console.log('🔍 Admin API: Updating business:', businessId, { name, contact_email, status })

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

    // Check if another business with same email exists (excluding current business)
    const { data: existingBusiness } = await adminClient
      .from('businesses')
      .select('id, name')
      .eq('contact_email', contact_email)
      .neq('id', businessId)
      .single()

    if (existingBusiness) {
      return NextResponse.json(
        { success: false, error: 'Another business with this email already exists' } as ApiResponse<never>,
        { status: 409 }
      )
    }

    // Update the business using admin client (bypasses RLS)
    const updatePayload = {
      name,
      description: description || '',
      contact_email,
      location: location || '',
      website_url: website_url || '',
      status: status || 'active',
      is_flagged: is_flagged || false,
      admin_notes: admin_notes || '',
      card_requested: card_requested || false,
      logo_url: logo_url || null,
      latitude: latitude || null,
      longitude: longitude || null,
      place_id: place_id || '',
      formatted_address: formatted_address || '',
      updated_at: new Date().toISOString()
    }

    const { data: updatedBusiness, error } = await adminClient
      .from('businesses')
      .update(updatePayload)
      .eq('id', businessId)
      .select()
      .single()

    if (error) {
      console.error('❌ Admin API: Error updating business:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update business: ' + error.message } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ Admin API: Business updated successfully:', updatedBusiness.name)

    return NextResponse.json({
      success: true,
      data: updatedBusiness,
      message: 'Business updated successfully'
    } as ApiResponse<typeof updatedBusiness>)

  } catch (error) {
    console.error('❌ Admin API: Error in business update:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/businesses/[id]
 * 
 * Deletes a business and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    
    console.log('🔍 Admin API: Deleting business:', businessId)

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

    // Check if business exists and get its data first
    const { data: businessToDelete, error: fetchError } = await adminClient
      .from('businesses')
      .select('name, id')
      .eq('id', businessId)
      .single()

    if (fetchError || !businessToDelete) {
      return NextResponse.json(
        { success: false, error: 'Business not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    // Check for related data that would prevent deletion
    const [
      { data: stampCards },
      { data: membershipCards },
      { data: customerCards }
    ] = await Promise.all([
      adminClient.from('stamp_cards').select('id').eq('business_id', businessId),
      adminClient.from('membership_cards').select('id').eq('business_id', businessId),
      adminClient.from('customer_cards').select('id').eq('business_id', businessId)
    ])

    const totalRelatedRecords = (stampCards?.length || 0) + (membershipCards?.length || 0) + (customerCards?.length || 0)

    if (totalRelatedRecords > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete business with ${totalRelatedRecords} related records. Please remove all cards and customers first.`,
          details: {
            stampCards: stampCards?.length || 0,
            membershipCards: membershipCards?.length || 0,
            customerCards: customerCards?.length || 0
          }
        } as ApiResponse<never>,
        { status: 409 }
      )
    }

    // Delete the business
    const { error: deleteError } = await adminClient
      .from('businesses')
      .delete()
      .eq('id', businessId)

    if (deleteError) {
      console.error('❌ Admin API: Error deleting business:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete business: ' + deleteError.message } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ Admin API: Business deleted successfully:', businessToDelete.name)

    return NextResponse.json({
      success: true,
      data: { id: businessId, name: businessToDelete.name },
      message: 'Business deleted successfully'
    } as ApiResponse<{ id: string, name: string }>)

  } catch (error) {
    console.error('❌ Admin API: Error in business deletion:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}