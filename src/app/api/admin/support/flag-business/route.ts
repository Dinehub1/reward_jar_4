import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser, getServerSession } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    createServerClient(
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role_id !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { businessId, flagStatus, comment } = body

    if (!businessId || typeof flagStatus !== 'boolean' || !comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: businessId, flagStatus (boolean), comment' 
      }, { status: 400 })
    }

    // Call the admin function
    const { data: result, error } = await supabase
      .rpc('admin_flag_business', {
        p_admin_id: user.id,
        p_business_id: businessId,
        p_flag_status: flagStatus,
        p_comment: comment
      })

    if (error) {
      console.error('Error flagging business:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${flagStatus ? 'flagged' : 'unflagged'} business`,
      data: result
    })

  } catch (error) {
    console.error('Admin flag business error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 