import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
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

    // ✅ Server-side only - safe to use admin client
    const supabase = createAdminClient()
    
    // First, try a simple query to see if the business exists
    const { data: businessCheck, error: checkError } = await supabase
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
      supabase.from('users').select('email, created_at').eq('id', businessCheck.owner_id).single(),
      supabase.from('stamp_cards').select('id, name, status').eq('business_id', businessId),
      supabase.from('customer_cards').select('id, customer_id, card_type, status').eq('business_id', businessId)
    ])

    // Combine the data
    const business = {
      ...businessCheck,
      users: ownerData,
      stamp_cards: stampCards || [],
      customer_cards: customerCards || []
    }

    console.log('✅ Admin API: Business details fetched successfully:', business?.name)
    
    return NextResponse.json({
      success: true,
      data: business
    } as ApiResponse<typeof business>)

  } catch (error) {
    console.error('❌ Admin API: Error in business details fetch:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}