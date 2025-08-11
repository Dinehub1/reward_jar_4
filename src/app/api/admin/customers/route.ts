import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { Customer, ApiResponse, PaginatedResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/customers
 * 
 * Fetches customers data for admin panel
 * 
 * Query Parameters:
 * - page: number - Page number for pagination (1-based)
 * - limit: number - Items per page (default: 20, max: 100)
 * - search: string - Search customers by name or email
 * - detailed: boolean - Include customer cards data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const search = url.searchParams.get('search')
    const detailed = url.searchParams.get('detailed') === 'true'

    // Build base query
    // Build query based on detailed flag
    const baseQuery = supabase.from('customers')
    
    let queryBuilder
    if (detailed) {
      queryBuilder = baseQuery.select(`
        id,
        user_id,
        name,
        email,
        created_at,
        users!customers_user_id_fkey(
          id,
          email,
          role_id,
          created_at
        ),
        customer_cards(
          id,
          stamp_card_id,
          membership_card_id,
          current_stamps,
          sessions_used,
          expiry_date,
          wallet_type,
          created_at,
          stamp_cards(
            id,
            name,
            business_id,
            businesses(name)
          ),
          membership_cards(
            id,
            name,
            business_id,
            businesses(name)
          )
        )
      `)
    } else {
      queryBuilder = baseQuery.select(`
        id,
        user_id,
        name,
        email,
        created_at
      `)
    }

    // Apply search filter if provided
    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Execute query with ordering and pagination
    const offset = (page - 1) * limit
    const { data: customers, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customers' } as ApiResponse<never>,
        { status: 500 }
      )
    }


    // Return paginated response if pagination was requested
    if (url.searchParams.has('page')) {
      const totalCount = count || 0
      const hasMore = page * limit < totalCount
      
      const paginatedResponse: PaginatedResponse<Customer> = {
        data: customers || [],
        count: totalCount,
        page,
        limit,
        hasMore
      }
      
      return NextResponse.json({
        success: true,
        data: paginatedResponse
      } as ApiResponse<PaginatedResponse<Customer>>)
    }

    // Return simple response
    return NextResponse.json({
      success: true,
      data: customers || []
    } as ApiResponse<Customer[]>)

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/customers
 * 
 * Creates a new customer (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    

    // Validate required fields
    const { name, email, user_id } = body
    
    if (!name || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Name and user_id are required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Create customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        name,
        email: email || null,
        user_id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create customer' } as ApiResponse<never>,
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    } as ApiResponse<Customer>)

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}