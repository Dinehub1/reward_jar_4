import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import type { AuthoringPayload, CardTemplate, CardTemplateVersion } from '@/lib/templates/types'

// GET /api/admin/templates
// Lists templates. If tables are missing, returns an empty list (draft-only safe behavior).
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('card_templates')
      .select('id, business_id, name, type, schema_version, created_at')
      .order('created_at', { ascending: false })

    if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] as CardTemplate[] })
    }

    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []) as CardTemplate[] })
  } catch (error) {
    return NextResponse.json({ success: true, data: [] })
  }
}

// POST /api/admin/templates
// Creates a template and initial version (draft). If tables missing, no-op with success=true to avoid breaking flows.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { businessId, name, type, uiPayload } = body as { businessId: string; name: string; type: 'stamp'|'membership'; uiPayload: AuthoringPayload }

    // Admin enforcement: require authenticated admin (role_id = 1)
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

    const supabase = createAdminClient()

    // Insert template
    const { data: template, error: tErr } = await supabase
      .from('card_templates')
      .insert({ business_id: businessId, name, type, schema_version: 1 })
      .select()
      .single()

    if (tErr?.message?.includes('relation') && tErr?.message?.includes('does not exist')) {
      // Draft-only safe behavior: pretend created
      return NextResponse.json({ success: true, data: { id: 'draft-local', name, type } })
    }
    if (tErr) throw tErr

    // Insert first version (draft)
    const { data: version, error: vErr } = await supabase
      .from('card_template_versions')
      .insert({ template_id: template.id, version: 1, ui_payload: uiPayload, is_published: false })
      .select()
      .single()

    if (vErr) throw vErr

    return NextResponse.json({ success: true, data: { template, version } as { template: CardTemplate; version: CardTemplateVersion } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 })
  }
}

