import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/businesses-simple
 * 
 * Simple businesses endpoint for dashboard display - no authentication required
 * Returns basic business info for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    
    const supabase = createAdminClient()
    
    // Fetch basic business data without auth checks
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        contact_email,
        status,
        is_flagged,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20) // Limit to prevent memory issues
    
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
      message: `Found ${businesses?.length || 0} businesses`
    } as ApiResponse<any[]>)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}