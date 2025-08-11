import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser } from '@/lib/supabase/server'

// Get card details for QR scan processing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    const supabase = await createServerClient()
    const { user } = await getServerUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get customer card with related data
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        customer_name,
        stamp_card_id,
        membership_card_id,
        stamp_card:stamp_cards(
          id,
          name,
          business_id,
          businesses(id, name, owner_id)
        ),
        membership_card:membership_cards(
          id,
          name,
          business_id,
          membership_mode,
          discount_type,
          discount_value,
          min_spend_cents,
          businesses(id, name, owner_id)
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (cardError || !customerCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Determine card type and business
    let cardType: 'stamp' | 'membership'
    let cardName: string
    let businessData: any
    let membershipCard: any = null

    if (customerCard.stamp_card_id && customerCard.stamp_card) {
      cardType = 'stamp'
      cardName = customerCard.stamp_card.name
      businessData = customerCard.stamp_card.businesses
    } else if (customerCard.membership_card_id && customerCard.membership_card) {
      cardType = 'membership'
      cardName = customerCard.membership_card.name
      businessData = customerCard.membership_card.businesses
      membershipCard = {
        name: customerCard.membership_card.name,
        membership_mode: customerCard.membership_card.membership_mode,
        discount_type: customerCard.membership_card.discount_type,
        discount_value: customerCard.membership_card.discount_value,
        min_spend_cents: customerCard.membership_card.min_spend_cents
      }
    } else {
      return NextResponse.json({ error: 'Invalid card configuration' }, { status: 400 })
    }

    if (!businessData) {
      return NextResponse.json({ error: 'Business data not found' }, { status: 404 })
    }

    // Check if user has access to this business (business owner or admin)
    const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
    const { data: userRow } = await adminClient.from('users').select('role_id').eq('id', user.id).single()
    const roleId = userRow?.role_id ?? 0

    if (roleId !== 1 && businessData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this business' }, { status: 403 })
    }

    // Return scan result data
    const scanResult = {
      customerCardId,
      cardType,
      cardName,
      customerName: customerCard.customer_name,
      businessId: businessData.id,
      businessName: businessData.name,
      ...(membershipCard && { membershipCard })
    }

    return NextResponse.json(scanResult)

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}