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
    
    console.log('🔄 Admin API: Clearing card request for business ID:', businessId)

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
      console.error('❌ Admin API: Failed to clear card request:', updateError)
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
      console.error('❌ Admin API: Business not found:', businessId)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Business not found' 
        } as ApiResponse<null>,
        { status: 404 }
      )
    }

    console.log('✅ Admin API: Card request cleared successfully:', business.name)

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
      console.warn('⚠️ Admin API: Failed to log action:', logError)
    }

    return NextResponse.json({
      success: true,
      data: business,
      message: `Card request cleared for ${business.name}`
    } as ApiResponse<typeof business>)

  } catch (error) {
    console.error('❌ Admin API: Unexpected error clearing card request:', error)
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