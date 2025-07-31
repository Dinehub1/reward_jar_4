import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { BusinessWithDetails, ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/businesses/[id]
 * 
 * Fetches a specific business with detailed information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const businessId = params.id
    
    console.log('🏢 ADMIN BUSINESS API - Fetching business:', businessId)

    // Fetch business with all related data
    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        contact_email,
        owner_id,
        status,
        is_flagged,
        admin_notes,
        created_at,
        users!businesses_owner_id_fkey(
          id,
          email,
          role_id,
          created_at
        ),
        stamp_cards(
          id,
          name,
          total_stamps,
          reward_description,
          status,
          created_at,
          customer_cards(
            id,
            customer_id,
            current_stamps,
            wallet_type,
            created_at
          )
        ),
        membership_cards(
          id,
          name,
          membership_type,
          total_sessions,
          cost,
          duration_days,
          status,
          created_at,
          customer_cards(
            id,
            customer_id,
            sessions_used,
            expiry_date,
            wallet_type,
            created_at
          )
        )
      `)
      .eq('id', businessId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Business not found' } as ApiResponse<never>,
          { status: 404 }
        )
      }
      
      console.error('💥 ADMIN BUSINESS API - Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch business' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ ADMIN BUSINESS API - Business fetched successfully:', business.name)

    return NextResponse.json({
      success: true,
      data: business
    } as ApiResponse<BusinessWithDetails>)

  } catch (error) {
    console.error('💥 ADMIN BUSINESS API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/businesses/[id]
 * 
 * Updates a specific business
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const businessId = params.id
    const body = await request.json()
    
    console.log('🏢 ADMIN BUSINESS API - Updating business:', businessId, body)

    // Extract updatable fields
    const {
      name,
      description,
      contact_email,
      status,
      is_flagged,
      admin_notes
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (contact_email !== undefined) updateData.contact_email = contact_email
    if (status !== undefined) updateData.status = status
    if (is_flagged !== undefined) updateData.is_flagged = is_flagged
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Update business
    const { data: business, error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Business not found' } as ApiResponse<never>,
          { status: 404 }
        )
      }
      
      console.error('💥 ADMIN BUSINESS API - Update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update business' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ ADMIN BUSINESS API - Business updated successfully:', business.name)

    return NextResponse.json({
      success: true,
      data: business,
      message: 'Business updated successfully'
    } as ApiResponse<BusinessWithDetails>)

  } catch (error) {
    console.error('💥 ADMIN BUSINESS API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/businesses/[id]
 * 
 * Deletes a specific business (admin only, use with caution)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const businessId = params.id
    
    console.log('🏢 ADMIN BUSINESS API - Deleting business:', businessId)

    // Check if business has any cards or customers before deletion
    const { data: relatedData } = await supabase
      .from('stamp_cards')
      .select('id')
      .eq('business_id', businessId)
      .limit(1)

    if (relatedData && relatedData.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete business with existing cards. Remove all cards first.' 
        } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Delete business
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId)

    if (error) {
      console.error('💥 ADMIN BUSINESS API - Delete error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete business' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log('✅ ADMIN BUSINESS API - Business deleted successfully:', businessId)

    return NextResponse.json({
      success: true,
      message: 'Business deleted successfully'
    } as ApiResponse<never>)

  } catch (error) {
    console.error('💥 ADMIN BUSINESS API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}