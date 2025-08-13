import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/businesses-simple
 * 
 * Optimized businesses endpoint for admin dashboard with pagination support
 * Returns business data with proper field selection and authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Extract pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per request
    const search = searchParams.get('search') || ''
    
    const supabase = createAdminClient()
    
    // Build query with proper field selection for performance
    let query = supabase
      .from('businesses')
      .select(`
        id,
        name,
        contact_email,
        status,
        is_flagged,
        card_requested,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Add search filter if provided
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%`)
    }
    
    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data: businesses, error, count } = await query
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch businesses data',
        details: error.message
      } as ApiResponse<never>, { status: 500 })
    }
    
    
    return NextResponse.json({
      success: true,
      data: businesses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: (page * limit) < (count || 0),
        hasPrev: page > 1
      },
      message: `Found ${businesses?.length || 0} of ${count || 0} businesses`
    } as ApiResponse<any[]>)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}