import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = createAdminClient()
    const { data: template, error } = await supabase
      .from('card_templates')
      .select('id, business_id, name, type, schema_version, created_at')
      .eq('id', id)
      .single()

    if (error) throw error

    const { data: versions, error: vErr } = await supabase
      .from('card_template_versions')
      .select('id, template_id, version, ui_payload, pass_payload, is_published, created_at')
      .eq('template_id', id)
      .order('version', { ascending: false })

    if (vErr) throw vErr

    return NextResponse.json({ success: true, data: { template, versions } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    // Admin enforcement
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const adminCheck = createAdminClient()
    const { data: roleRow, error: roleErr } = await adminCheck
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()
    if (roleErr || !roleRow || roleRow.role_id !== 1) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    // Disallow type updates (immutable)
    if (typeof body?.type !== 'undefined') {
      return NextResponse.json({ success: false, error: 'Template type is immutable' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('card_templates')
      .update({ name: body.name })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 })
  }
}

