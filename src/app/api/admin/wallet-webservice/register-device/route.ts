import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// POST /api/admin/wallet-webservice/register-device
// Body: { deviceLibraryIdentifier, pushToken }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceLibraryIdentifier, pushToken, platform = 'ios' } = body || {}
    if (!deviceLibraryIdentifier || !pushToken) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: device, error } = await admin
      .from('wallet_devices')
      .upsert({ device_library_identifier: deviceLibraryIdentifier, push_token: pushToken, platform })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: device })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

