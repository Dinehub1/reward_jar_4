import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// POST body: { passTypeIdentifier, serialNumber, payload }
export async function POST(req: NextRequest) {
  try {
    if (process.env.DISABLE_GOOGLE_WALLET === 'true') {
      return NextResponse.json({ success: false, error: 'Google Wallet disabled' }, { status: 400 })
    }
    const body = await req.json()
    const { passTypeIdentifier, serialNumber, payload = {} } = body || {}
    if (!passTypeIdentifier || !serialNumber) {
      return NextResponse.json({ success: false, error: 'Missing passTypeIdentifier or serialNumber' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: pass, error: passErr } = await admin
      .from('wallet_passes')
      .select('id, update_tag')
      .eq('pass_type_id', passTypeIdentifier)
      .eq('serial_number', serialNumber)
      .single()
    if (passErr) throw passErr

    // bump update_tag
    await admin
      .from('wallet_passes')
      .update({ update_tag: (pass.update_tag || 1) + 1 })
      .eq('id', pass.id)

    const { data: queued, error: qErr } = await admin
      .from('wallet_push_queue')
      .insert({ pass_id: pass.id, platform: 'google', payload })
      .select('id')
      .single()
    if (qErr) throw qErr

    return NextResponse.json({ success: true, queueId: queued.id })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

