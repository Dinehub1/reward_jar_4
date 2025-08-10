import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import type { AuthoringPayload } from '@/lib/templates/types'
import { buildApplePassJson } from '@/lib/wallet/builders/apple-pass-builder'
import { createLoyaltyObject, buildGoogleIds } from '@/lib/wallet/builders/google-pass-builder'

// POST /api/admin/templates/[id]/versions
// Creates a new version; if publish=true, mark as published and unpublish others.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { uiPayload, publish } = body as { uiPayload: AuthoringPayload; publish?: boolean }
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

    const supabase = createAdminClient()

    // Determine next version number
    const { data: last, error: lErr } = await supabase
      .from('card_template_versions')
      .select('version')
      .eq('template_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lErr) throw lErr
    const nextVersion = (last?.version || 0) + 1

    // Optionally build pass payload snapshot when publish=true
    let pass_payload: any = null
    if (publish) {
      try {
        // Minimal demo snapshot. Real snapshot should use derived labels and card/customer context.
        const apple = buildApplePassJson({
          customerCardId: 'TEMPLATE-PREVIEW',
          isMembershipCard: uiPayload.type === 'membership',
          cardData: { name: uiPayload.cardName, total_stamps: uiPayload.stampsRequired, reward_description: uiPayload.rewardDescription, card_color: uiPayload.cardColor },
          businessData: { name: uiPayload.businessName || 'Business' },
          derived: { progressLabel: 'Progress', remainingLabel: 'Remaining', primaryValue: '0/' + (uiPayload.stampsRequired || 10), progressPercent: 0, remainingCount: uiPayload.stampsRequired || 10, isCompleted: false }
        })
        const ids = buildGoogleIds('TEMPLATE-PREVIEW')
        const loyaltyObj = createLoyaltyObject({ ids, current: 0, total: uiPayload.stampsRequired || 10, objectDisplayId: 'TEMPLATE-PREVIEW', displayName: uiPayload.cardName })
        pass_payload = { apple, google: { loyaltyObject: loyaltyObj } }
      } catch (e) {
        console.warn('Snapshot build failed (non-fatal):', e)
      }
    }

    const { data: version, error: vErr } = await supabase
      .from('card_template_versions')
      .insert({ template_id: id, version: nextVersion, ui_payload: uiPayload, is_published: !!publish, pass_payload })
      .select()
      .single()
    if (vErr) throw vErr

    if (publish) {
      // Log template published event (non-financial)
      try {
        const adminClient = createAdminClient()
        await adminClient.from('card_events').insert({
          card_id: '00000000-0000-0000-0000-000000000000',
          event_type: 'template_published',
          metadata: { template_id: id, version: nextVersion }
        })
      } catch (e) {
        console.warn('template_published event insert failed (non-fatal):', e)
      }
      const { error: uErr } = await supabase
        .from('card_template_versions')
        .update({ is_published: false })
        .eq('template_id', id)
        .neq('id', version.id)
      if (uErr) throw uErr
    }

    return NextResponse.json({ success: true, data: version })
  } catch (error) {
    console.error('Template Version POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create version' }, { status: 500 })
  }
}

