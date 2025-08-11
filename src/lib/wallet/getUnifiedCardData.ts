type SupabaseLike = {
  from: (table: string) => any
}

export type UnifiedBusiness = {
  id: string
  name: string
  description?: string | null
  currency_code?: string | null
  locale?: string | null
}

export type UnifiedCardData = {
  customerCard: any
  isStampCard: boolean
  isMembershipCard: boolean
  cardData: any
  businessData: UnifiedBusiness
}

export async function getUnifiedCardData(
  supabase: SupabaseLike,
  customerCardId: string
): Promise<UnifiedCardData> {
  const { data: customerCard, error } = await supabase
    .from('customer_cards')
    .select(`
      id,
      customer_id,
      stamp_card_id,
      membership_card_id,
      current_stamps,
      sessions_used,
      expiry_date,
      stamp_cards (
        id,
        name,
        total_stamps,
        reward_description,
        card_color,
        icon_emoji,
        business_id
      ),
      membership_cards (
        id,
        name,
        total_sessions,
        card_color,
        icon_emoji,
        business_id
      )
    `)
    .eq('id', customerCardId)
    .single()

  if (error || !customerCard) {
    throw new Error('Customer card not found')
  }

  const isStampCard = customerCard.stamp_card_id !== null
  const isMembershipCard = customerCard.membership_card_id !== null

  const cardData = isStampCard ? customerCard.stamp_cards : customerCard.membership_cards

  let businessData: UnifiedBusiness | null = null
  if (cardData?.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id,name,description,currency_code,locale')
      .eq('id', cardData.business_id)
      .single()
    businessData = business
  }

  if (!cardData || !businessData) {
    throw new Error('Card template or business not found')
  }

  return { customerCard, isStampCard, isMembershipCard, cardData, businessData }
}

