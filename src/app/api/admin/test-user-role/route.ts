import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * Test endpoint to isolate role lookup performance issues
 * Development use only
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    console.log(`[AUTH-DEBUG] Starting role lookup for user: ${userId}`)
    
    // Test the exact query used in login
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userId)
      .single()

    const queryTime = Date.now() - startTime
    console.log(`[AUTH-DEBUG] Role lookup completed in ${queryTime}ms`)

    if (roleError) {
      console.error('[AUTH-DEBUG] Role lookup error:', roleError)
      return NextResponse.json({
        error: roleError.message,
        code: roleError.code,
        queryTime
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId,
      role_id: userData?.role_id,
      queryTime,
      performance: queryTime > 1000 ? 'SLOW' : queryTime > 500 ? 'MEDIUM' : 'FAST'
    })

  } catch (error: any) {
    console.error('[AUTH-DEBUG] Test endpoint error:', error)
    return NextResponse.json({
      error: error.message,
      queryTime: -1
    }, { status: 500 })
  }
}