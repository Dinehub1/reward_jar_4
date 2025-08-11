import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/mcp/auth'
import { getAllMembershipCards } from '@/mcp/cards'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/business/memberships
 * Get membership cards for authenticated business owner
 */
export async function GET(request: NextRequest) {
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

    // Get URL parameters for filtering and pagination
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') || 'active'

    // Get membership cards using MCP with business filter
    const cardsResult = await getAllMembershipCards({
      page,
      limit,
      filters: {
        business_id: authContext.businessId,
        status: status
      },
      orderBy: 'created_at',
      orderDirection: 'desc'
    })
    
    if (!cardsResult.success) {
      return NextResponse.json(
        { success: false, error: cardsResult.error || 'Failed to fetch membership cards' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cardsResult.data,
      pagination: cardsResult.pagination
    } as ApiResponse<typeof cardsResult.data>)

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}