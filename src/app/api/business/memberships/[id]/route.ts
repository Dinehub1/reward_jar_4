import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/mcp/auth'
import { getMembershipCardById } from '@/mcp/cards'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/business/memberships/[id]
 * Get specific membership card details for authenticated business owner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: membershipId } = await params

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

    // Get membership card using MCP
    const cardResult = await getMembershipCardById(membershipId)
    
    if (!cardResult.success) {
      return NextResponse.json(
        { success: false, error: cardResult.error || 'Failed to fetch membership card' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    const membershipCard = cardResult.data

    if (!membershipCard) {
      return NextResponse.json(
        { success: false, error: 'Membership card not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    // Verify the card belongs to this business
    if (membershipCard.business_id !== authContext.businessId) {
      return NextResponse.json(
        { success: false, error: 'Membership card not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    // TODO: Add customer stats and usage data from customer_cards table
    // For now, return the basic membership card data
    const membershipWithStats = {
      ...membershipCard,
      customer_count: 0,
      active_memberships: 0,
      expired_memberships: 0,
      revenue: 0,
      recent_customers: []
    }

    return NextResponse.json({
      success: true,
      data: membershipWithStats
    } as ApiResponse<typeof membershipWithStats>)

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}