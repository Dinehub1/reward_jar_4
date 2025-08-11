import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/customers-simple
 * 
 * Simple customers endpoint for dashboard display - no authentication required
 * Returns basic customer info for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    
    const supabase = createAdminClient()
    
    // Fetch basic customer data without auth checks
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        id,
        email,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to prevent memory issues
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch customers data',
        details: error.message
      } as ApiResponse<never>, { status: 500 })
    }
    
    
    return NextResponse.json({
      success: true,
      data: customers || [],
      message: `Found ${customers?.length || 0} customers`
    } as ApiResponse<any[]>)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}