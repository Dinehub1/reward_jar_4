export interface QuickStartData {
  cardName: string
  businessId: string
  reward?: string
  rewardDescription?: string
  stampsRequired: number
  cardColor: string
  iconEmoji: string
  barcodeType: 'QR_CODE' | 'PDF417'
  cardExpiryDays: number
  rewardExpiryDays: number
  stampConfig: any
  cardDescription?: string
  howToEarnStamp?: string
  rewardDetails?: string
  earnedStampMessage?: string
  earnedRewardMessage?: string
  // Membership fields
  membershipMode?: 'sessions' | 'discount'
  discountType?: 'percent' | 'amount'
  discountValue?: number
  minSpendCents?: number
  stackable?: boolean
  maxUsesPerDay?: number
  maxUsesPerWeek?: number
  validityWindows?: any
  eligibleCategories?: string[]
  eligibleSkus?: string[]
}

export function generateCardContent(businessName: string, template: { cardColor: string; iconEmoji: string; stampsRequired: number; reward: string; rewardDescription?: string; cardDescription?: string; howToEarnStamp?: string; rewardDetails?: string; stampConfig: any }, customReward?: string) {
  return {
    cardColor: template.cardColor,
    iconEmoji: template.iconEmoji,
    stampsRequired: template.stampsRequired,
    reward: customReward || template.reward,
    rewardDescription: template.rewardDescription,
    cardDescription: template.cardDescription,
    howToEarnStamp: template.howToEarnStamp,
    rewardDetails: template.rewardDetails,
    stampConfig: template.stampConfig,
  }
}

export function mapQuickToAdvancedPayload(input: QuickStartData) {
  return {
    card_name: input.cardName,
    business_id: input.businessId,
    reward: input.reward || '',
    reward_description: input.rewardDescription || '',
    stamps_required: input.stampsRequired,
    card_color: input.cardColor,
    icon_emoji: input.iconEmoji,
    barcode_type: input.barcodeType,
    card_expiry_days: input.cardExpiryDays,
    reward_expiry_days: input.rewardExpiryDays,
    stamp_config: input.stampConfig,
    card_description: input.cardDescription || 'Collect stamps to get rewards',
    how_to_earn_stamp: input.howToEarnStamp || 'Buy anything to get a stamp',
    reward_details: input.rewardDetails || '',
    earned_stamp_message: input.earnedStampMessage || 'Just [#] more stamps to get your reward!',
    earned_reward_message: input.earnedRewardMessage || 'Reward is earned and waiting for you!',
    // Membership mapping (optional; used when membership card selected)
    membership_mode: input.membershipMode,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minSpendCents: input.minSpendCents,
    stackable: input.stackable,
    maxUsesPerDay: input.maxUsesPerDay,
    maxUsesPerWeek: input.maxUsesPerWeek,
    validityWindows: input.validityWindows,
    eligibleCategories: input.eligibleCategories,
    eligibleSkus: input.eligibleSkus,
  }
}

