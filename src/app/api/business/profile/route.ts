import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/mcp/auth'
import { updateBusiness, getBusinessByOwner } from '@/mcp/businesses'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/business/profile
 * Get current business profile for authenticated business owner
 */
export async function GET() {
  try {
    // Get auth context using MCP
    const authResult = await getAuthContext()
    
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const authContext = authResult.data

    // Verify this is a business user
    if (authContext.userRole !== 2) {
      return NextResponse.json(
        { success: false, error: 'Business access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Get business profile using MCP
    const businessResult = await getBusinessByOwner(authContext)
    
    if (!businessResult.success) {
      return NextResponse.json(
        { success: false, error: businessResult.error || 'Business not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: businessResult.data
    } as ApiResponse<typeof businessResult.data>)

  } catch (error) {
    console.error('Business profile GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * PUT /api/business/profile
 * Update business profile for authenticated business owner
 */
export async function PUT(request: NextRequest) {
  try {
    // Get auth context using MCP
    const authResult = await getAuthContext()
    
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const authContext = authResult.data

    // Verify this is a business user
    if (authContext.userRole !== 2 || !authContext.businessId) {
      return NextResponse.json(
        { success: false, error: 'Business access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Parse request body
    const updateData = await request.json()

    // Update business using MCP
    const updateResult = await updateBusiness(
      authContext.businessId,
      {
        ...updateData,
        updated_at: new Date().toISOString()
      },
      authContext
    )
    
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error || 'Failed to update business profile' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updateResult.data,
      message: 'Business profile updated successfully'
    } as ApiResponse<typeof updateResult.data>)

  } catch (error) {
    console.error('Business profile PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}