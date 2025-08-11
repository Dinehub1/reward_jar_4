import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { getServerUser, getServerSession } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
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
    const { customerCardId, daysToAdd, comment } = body

    if (!customerCardId || !daysToAdd || !comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerCardId, daysToAdd, comment' 
      }, { status: 400 })
    }

    // Call the admin function
    const { data: result, error } = await supabase
      .rpc('admin_extend_membership', {
        p_admin_id: user.id,
        p_customer_card_id: customerCardId,
        p_days_to_add: parseInt(daysToAdd),
        p_comment: comment
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully extended membership by ${daysToAdd} days`,
      data: result
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 