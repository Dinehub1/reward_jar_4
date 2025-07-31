import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * GET /api/admin/test-auth
 * 
 * Test endpoint to check users and their roles
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all users with their roles
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
        details: error.message
      })
    }
    
    // Count users by role
    const roleCounts = {
      admin: users?.filter(u => u.role_id === 1).length || 0,
      business: users?.filter(u => u.role_id === 2).length || 0,
      customer: users?.filter(u => u.role_id === 3).length || 0
    }
    
    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        roleCounts,
        totalUsers: users?.length || 0
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}