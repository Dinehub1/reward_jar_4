import { NextRequest, NextResponse } from 'next/server'
import envelope from '@/lib/api/envelope'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(envelope(undefined, 'Authentication required'), { status: 401 })

    const admin = createAdminClient()
    const { data: userData } = await admin
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()
    if (!userData || userData.role_id !== 1) return NextResponse.json(envelope(undefined, 'Admin access required'), { status: 403 })

    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'visits'
    const window = searchParams.get('window') || '30d'
    const data = { metric, window, anomalies: [] }
    return NextResponse.json(envelope(data))
  } catch {
    return NextResponse.json(envelope(undefined, 'Internal server error'), { status: 500 })
  }
}

