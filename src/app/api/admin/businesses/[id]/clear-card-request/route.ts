import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * POST /api/admin/businesses/[id]/clear-card-request
 * 
 * Clears the card_requested flag for a business after admin has created their cards
 * Uses admin client to bypass RLS for administrative operations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    

    // ✅ Server-side only - safe to use admin client
    const supabase = createAdminClient()

    // Update the business to clear the card_requested flag
    const { data: business, error: updateError } = await supabase
      .from('businesses')
      .update({ 
        card_requested: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId)
      .select('id, name, card_requested')
      .single()

    if (updateError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to clear card request',
          details: updateError.message 
        } as ApiResponse<null>,
        { status: 500 }
      )
    }

    if (!business) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Business not found' 
        } as ApiResponse<null>,
        { status: 404 }
      )
    }


    // Optional: Log this admin action for audit purposes
    try {
      await supabase
        .from('admin_support_logs')
        .insert({
          admin_id: 'system', // TODO: Get actual admin user ID from session
          action: 'clear_card_request',
          target_type: 'business',
          target_id: businessId,
          details: `Cleared card request for business: ${business.name}`,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Don't fail the main operation if logging fails
    }

    return NextResponse.json({
      success: true,
      data: business,
      message: `Card request cleared for ${business.name}`
    } as ApiResponse<typeof business>)

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<null>,
      { status: 500 }
    )
  }
}