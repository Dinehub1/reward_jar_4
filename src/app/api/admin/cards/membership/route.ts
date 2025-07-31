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

    // Check if user is admin (role_id = 1)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role_id !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      business_id,
      name,
      description,
      membership_type,
      total_sessions,
      cost,
      duration_days,
      status = 'active'
    } = body

    // Validate required fields
    if (!business_id || !name || !membership_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: business_id, name, membership_type' 
      }, { status: 400 })
    }

    // Create membership card
    const { data: membershipCard, error: createError } = await supabase
      .from('membership_cards')
      .insert({
        business_id,
        name,
        description,
        membership_type,
        total_sessions: total_sessions ? parseInt(total_sessions) : null,
        cost: cost ? parseInt(cost) : null,
        duration_days: duration_days ? parseInt(duration_days) : null,
        status
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating membership card:', createError)
      return NextResponse.json({ error: 'Failed to create membership card' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: membershipCard,
      message: 'Membership card created successfully'
    })

  } catch (error) {
    console.error('Admin membership card creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 