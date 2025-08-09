import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// POST /api/admin/wallet-webservice/register-pass
// Body: { passTypeIdentifier, serialNumber, deviceLibraryIdentifier }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { passTypeIdentifier, serialNumber, deviceLibraryIdentifier } = body || {}
    if (!passTypeIdentifier || !serialNumber || !deviceLibraryIdentifier) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: pass, error: passErr } = await admin
      .from('wallet_passes')
      .select('id')
      .eq('pass_type_id', passTypeIdentifier)
      .eq('serial_number', serialNumber)
      .single()
    if (passErr) throw passErr

    const { data: device, error: devErr } = await admin
      .from('wallet_devices')
      .select('id')
      .eq('device_library_identifier', deviceLibraryIdentifier)
      .single()
    if (devErr) throw devErr

    const { error: regErr } = await admin
      .from('wallet_registrations')
      .upsert({ device_id: device.id, pass_id: pass.id })
    if (regErr) throw regErr

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

