import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

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
    console.error('Template GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('card_templates')
      .update({ name: body.name, type: body.type })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Template PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 })
  }
}

