import { NextRequest, NextResponse } from 'next/server'
import { getAllBusinesses } from '@/mcp/businesses'
import { requireAdmin } from '@/mcp/auth'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/businesses
 * 
 * Fetches businesses data for admin panel via MCP layer
 * 
 * Query Parameters:
 * - page: number - Page number for pagination (1-based)
 * - limit: number - Items per page (default: 20, max: 100)
 * - search: string - Search businesses by name or email
 * - status: string - Filter by business status
 * - flagged: boolean - Filter flagged businesses only
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication via MCP
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error } as ApiResponse<never>,
        { status: 401 }
      )
    }
    
    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    const flaggedOnly = url.searchParams.get('flagged') === 'true'
    
    // Build filters
    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (flaggedOnly) filters.is_flagged = true
    if (search) filters._search = search // Special search filter
    
    // Call MCP layer
    const result = await getAllBusinesses({
      page,
      limit,
      filters,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/businesses
 * 
 * Creates a new business (admin only) via MCP layer
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication via MCP
    const authResult = await requireAdmin()
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { name, contact_email, owner_id, description, status = 'active' } = body
    
    if (!name || !owner_id) {
      return NextResponse.json(
        { success: false, error: 'Name and owner_id are required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Call MCP layer to create business
    const { createBusiness } = await import('@/mcp/businesses')
    const result = await createBusiness({
      name,
      description: description || '',
      contact_email: contact_email || '',
      owner_id,
      status
    }, authResult.data!)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Business created successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}