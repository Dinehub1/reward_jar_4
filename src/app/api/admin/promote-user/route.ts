import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * POST /api/admin/promote-user
 * 
 * Promote a user to admin role (for testing purposes)
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      })
    }
    
    const supabase = createAdminClient()
    
    // Ensure admin role exists
    await supabase
      .from('roles')
      .upsert({ id: 1, name: 'admin' })
    
    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('email', email)
      .single()
    
    if (findError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: findError?.message
      })
    }
    
    // Update user to admin role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role_id: 1 })
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to promote user',
        details: updateError.message
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        message: `User ${email} promoted to admin`
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