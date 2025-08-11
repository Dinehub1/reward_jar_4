import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser } from '@/lib/supabase/server'

// Discount redemption route - requires staff auth + bill amount entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    const body = await request.json()
    const { businessId, billAmountCents, override = false, notes = null, deviceId = null, terminalId = null } = body as {
      businessId?: string
      billAmountCents: number
      override?: boolean
      notes?: string | null
      deviceId?: string | null
      terminalId?: string | null
    }

    const supabase = await createServerClient()
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Role check: require business (role_id=2) or admin with override flag
    const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
    const { data: userRow } = await adminClient.from('users').select('role_id').eq('id', user.id).single()
    const roleId = userRow?.role_id ?? 0

    if (roleId === 1 && !override) {
      return NextResponse.json({ success: false, error: 'Admin requires override flag for discount redemptions' }, { status: 403 })
    }
    if (roleId !== 1 && roleId !== 2) {
      return NextResponse.json({ success: false, error: 'Only business staff or admin can process discount redemptions' }, { status: 403 })
    }

    if (!billAmountCents || billAmountCents <= 0) {
      return NextResponse.json({ success: false, error: 'Valid bill amount required for discount redemption' }, { status: 400 })
    }

    // Get customer card and membership details
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select(`
        *,
        membership_card:membership_cards(*)
      `)
      .eq('id', customerCardId)
      .single()

    if (cardError || !customerCard) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 })
    }

    if (!customerCard.membership_card) {
      return NextResponse.json({ success: false, error: 'Not a membership card' }, { status: 400 })
    }

    const membershipCard = customerCard.membership_card
    if (membershipCard.membership_mode !== 'discount') {
      return NextResponse.json({ success: false, error: 'Not a discount membership' }, { status: 400 })
    }

    // Validate business ownership if not admin
    if (roleId === 2) {
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id, owner_id')
        .eq('id', businessId || membershipCard.business_id)
        .single()

      if (!businessData || businessData.owner_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Not authorized for this business' }, { status: 403 })
      }
    }

    // Check minimum spend requirement
    if (membershipCard.min_spend_cents && billAmountCents < membershipCard.min_spend_cents) {
      return NextResponse.json({ 
        success: false, 
        error: `Minimum spend of ${membershipCard.min_spend_cents / 100} required for discount`,
        minSpendCents: membershipCard.min_spend_cents
      }, { status: 400 })
    }

    // Check cooldown period (prevent rapid repeat abuse)
    const { checkCooldown, getCooldownConfig } = await import('@/lib/utils/cooldown')
    const cooldownConfig = getCooldownConfig('discount')
    const cooldownResult = await checkCooldown(customerCardId, cooldownConfig)
    
    if (!cooldownResult.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: cooldownResult.error,
        cooldownMinutes: cooldownResult.cooldownMinutes,
        lastUsageAt: cooldownResult.lastUsageAt
      }, { status: 429 })
    }

    // Calculate discount amount
    const discountAmountCents = membershipCard.discount_type === 'percent'
      ? Math.floor(billAmountCents * (membershipCard.discount_value / 100))
      : Math.min(membershipCard.discount_value, billAmountCents)

    const finalAmountCents = billAmountCents - discountAmountCents

    // Record the discount usage
    const { error: usageError } = await supabase
      .from('session_usage')
      .insert({
        customer_card_id: customerCardId,
        usage_type: 'discount',
        marked_by: user.id,
        metadata: {
          business_id: businessId || membershipCard.business_id,
          device_id: deviceId,
          terminal_id: terminalId,
          original_amount_cents: billAmountCents,
          discount_amount_cents: discountAmountCents,
          final_amount_cents: finalAmountCents,
          discount_type: membershipCard.discount_type,
          discount_value: membershipCard.discount_value,
          override_used: override && roleId === 1
        }
      })

    if (usageError) {
      return NextResponse.json({ success: false, error: 'Failed to record discount usage' }, { status: 500 })
    }

    // Emit card_events: discount_redeemed
    try {
      await adminClient.from('card_events').insert({
        card_id: customerCardId,
        event_type: 'discount_redeemed',
        metadata: {
          business_id: businessId || membershipCard.business_id,
          staff_id: user.id,
          original_amount_cents: billAmountCents,
          discount_amount_cents: discountAmountCents,
          final_amount_cents: finalAmountCents,
          method: 'qr',
          device_id: deviceId,
          terminal_id: terminalId,
          override_used: override && roleId === 1
        }
      }
    } catch (e) {
    }

    return NextResponse.json({
      success: true,
      data: {
        customerCardId,
        discountApplied: {
          originalAmountCents: billAmountCents,
          discountType: membershipCard.discount_type,
          discountValue: membershipCard.discount_value
        },
        membershipCard: {
          name: membershipCard.name,
          businessName: 'Business' // Will be filled from actual business data in implementation
        }
      }
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}