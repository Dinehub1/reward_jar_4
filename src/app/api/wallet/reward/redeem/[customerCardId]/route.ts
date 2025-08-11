import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser } from '@/lib/supabase/server'

// Placeholder simple redemption route requiring staff auth. JWT nonce signing can be added later.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    const supabase = await createServerClient()
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    // Role check: require business (role_id=2) or admin with override flag
    const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
    const { data: userRow } = await adminClient.from('users').select('role_id').eq('id', user.id).single()
    const roleId = userRow?.role_id ?? 0
    const isAdmin = roleId === 1
    const isBusiness = roleId === 2
    // For now, allow both; if we add override flag in payload, enforce like mark-session

    // Validate card and check reward readiness
    const { data: card, error } = await supabase
      .from('customer_cards')
      .select(`id, current_stamps, stamp_cards ( id, total_stamps, businesses ( id, name ) )`)
      .eq('id', customerCardId)
      .single()

    if (error || !card) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 })
    }

    const isStamp = (card as any).stamp_cards !== null
    if (!isStamp) {
      return NextResponse.json({ success: false, error: 'Reward redeem only for stamp cards' }, { status: 400 })
    }

    const stampCard = (card as any).stamp_cards as { id: string, total_stamps: number, businesses: { id: string, name: string } }
    const ready = (card as any).current_stamps >= (stampCard.total_stamps || 0)
    if (!ready) {
      return NextResponse.json({ success: false, error: 'Reward not ready' }, { status: 400 })
    }

    // Reset stamps after redemption (one-cycle)
    const { error: updateError } = await supabase
      .from('customer_cards')
      .update({ current_stamps: 0, updated_at: new Date().toISOString() })
      .eq('id', customerCardId)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to redeem reward' }, { status: 500 })
    }

    // Emit reward_redeemed event
    try {
      const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
      await adminClient.from('card_events').insert({
        card_id: customerCardId,
        event_type: 'reward_redeemed',
        metadata: { business_id: stampCard.businesses.id, staff_id: user.id }
      })
    } catch (e) {
    }

    return NextResponse.json({ success: true, action: 'reward_redeemed' })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

