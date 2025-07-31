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
      reward_description,
      stamps_required,
      background_color,
      text_color,
      status = 'active'
    } = body

    // Validate required fields
    if (!business_id || !name || !stamps_required) {
      return NextResponse.json({ 
        error: 'Missing required fields: business_id, name, stamps_required' 
      }, { status: 400 })
    }

    // Create stamp card
    const { data: stampCard, error: createError } = await supabase
      .from('stamp_cards')
      .insert({
        business_id,
        name,
        description,
        reward_description,
        stamps_required: parseInt(stamps_required),
        background_color: background_color || '#3B82F6',
        text_color: text_color || '#FFFFFF',
        status
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating stamp card:', createError)
      return NextResponse.json({ error: 'Failed to create stamp card' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: stampCard,
      message: 'Stamp card created successfully'
    })

  } catch (error) {
    console.error('Admin stamp card creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 