import { NextRequest, NextResponse } from 'next/server'
import envelope from '@/lib/api/envelope'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  const { customerCardId } = await params
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('customer_cards')
      .select('id, updated_at, wallet_pass_id')
      .eq('id', customerCardId)
      .single()
    if (error || !data) {
      return NextResponse.json(envelope(undefined, 'Not found'), { status: 404 })
    }
    const active = !!data.wallet_pass_id
    return NextResponse.json(envelope({ active, lastSignedAt: data.updated_at }))
  } catch {
    return NextResponse.json(envelope(undefined, 'Internal server error'), { status: 500 })
  }
}

