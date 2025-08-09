import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// GET /api/admin/wallet-webservice/changes?passTypeIdentifier=...&since=updateTag
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const passTypeId = url.searchParams.get('passTypeIdentifier') || ''
    const since = Number(url.searchParams.get('since') || 0)
    if (!passTypeId) {
      return NextResponse.json({ success: false, error: 'Missing passTypeIdentifier' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('wallet_passes')
      .select('serial_number, update_tag')
      .eq('pass_type_id', passTypeId)
      .gt('update_tag', since)
      .order('update_tag', { ascending: true })
    if (error) throw error

    const lastTag = data?.length ? data[data.length - 1].update_tag : since
    return NextResponse.json({ success: true, data: { serialNumbers: data?.map(d => d.serial_number) || [], lastUpdated: lastTag } })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

