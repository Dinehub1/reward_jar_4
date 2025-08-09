import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { processGoogleQueue } from '@/lib/wallet/google-updater'

// POST /api/admin/wallet-webservice/google/queue/process
export async function POST(_req: NextRequest) {
  try {
    if (process.env.DISABLE_GOOGLE_WALLET === 'true') {
      return NextResponse.json({ success: false, error: 'Google Wallet disabled' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: items, error } = await admin
      .from('wallet_push_queue')
      .select('id, pass_id, payload')
      .eq('platform', 'google')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50)
    if (error) throw error

    const result = await processGoogleQueue((items || []) as any)

    if (result.succeeded.length) {
      await admin
        .from('wallet_push_queue')
        .update({ status: 'success', processed_at: new Date().toISOString() })
        .in('id', result.succeeded)
    }
    if (result.failed.length) {
      for (const f of result.failed) {
        await admin
          .from('wallet_push_queue')
          .update({ status: 'failed', error_message: f.error, processed_at: new Date().toISOString() })
          .eq('id', f.id)
      }
    }
    return NextResponse.json({ success: true, processed: (items || []).length, ...result })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

