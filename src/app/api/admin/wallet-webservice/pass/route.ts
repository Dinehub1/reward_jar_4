import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// GET /api/admin/wallet-webservice/pass?passTypeIdentifier=...&serialNumber=...
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const passTypeId = url.searchParams.get('passTypeIdentifier') || ''
    const serial = url.searchParams.get('serialNumber') || ''
    if (!passTypeId || !serial) {
      return NextResponse.json({ success: false, error: 'Missing passTypeIdentifier or serialNumber' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: pass, error } = await admin
      .from('wallet_passes')
      .select('*')
      .eq('pass_type_id', passTypeId)
      .eq('serial_number', serial)
      .single()
    if (error) throw error

    // TODO: Generate real pkpass or JSON pass content based on card type
    return NextResponse.json({ success: true, data: pass })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

