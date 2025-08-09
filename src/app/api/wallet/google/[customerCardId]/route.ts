/**
 * RewardJar 4.0 - Google Wallet API Route (Simplified)
 * Generates Google Wallet passes for stamp cards and membership cards
 * 
 * @version 4.0
 * @path /api/wallet/google/[customerCardId]
 * @created July 21, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import envelope from '@/lib/api/envelope'
import { buildUnifiedCardData, signForPlatform } from '@/lib/wallet/wallet-generation-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    const supabase = createAdminClient()
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select('id, customer_id, stamp_card_id, membership_card_id')
      .eq('id', customerCardId)
      .single()
    if (error || !customerCard) return NextResponse.json(envelope(undefined, 'Customer card not found'), { status: 404 })
    const cardId = customerCard.stamp_card_id || customerCard.membership_card_id
    if (!cardId) return NextResponse.json(envelope(undefined, 'No linked card'), { status: 400 })
    const unified = await buildUnifiedCardData(cardId, customerCard.customer_id)
    const signed = await signForPlatform('google', unified)
    if (!signed.success) return NextResponse.json(envelope(undefined, signed.error || 'Failed to sign'), { status: 500 })
    return NextResponse.json(envelope({ jwt: signed.jwt, saveUrl: signed.saveUrl }))
  } catch {
    return NextResponse.json(envelope(undefined, 'Internal server error'), { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  // Redirect POST to GET for Google Wallet
  return GET(request, { params })
}