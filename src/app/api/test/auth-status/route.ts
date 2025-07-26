import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({
        authenticated: false,
        error: `Session error: ${sessionError.message}`
      })
    }

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session found'
      })
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      return NextResponse.json({
        authenticated: true,
        user: session.user.email,
        role_error: userError.message
      })
    }

    // Get business data
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role_id: userData?.role_id,
        is_business: userData?.role_id === 2
      },
      business: businessError ? null : businessData,
      business_error: businessError?.message
    })

  } catch (error) {
    return NextResponse.json({
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 