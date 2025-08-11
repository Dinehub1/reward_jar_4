import type { CardLivePreviewData } from '@/components/unified/CardLivePreview'

/**
 * Map various card form shapes into CardLivePreviewData
 */
export function mapAdminCardFormToPreview(input: {
  cardName: string
  businessName: string
  businessLogoUrl?: string
  reward?: string
  rewardDescription?: string
  stampsRequired: number
  cardColor: string
  iconEmoji: string
  cardDescription?: string
  howToEarnStamp?: string
  rewardDetails?: string
}): CardLivePreviewData {
  return {
    cardType: 'stamp',
    businessName: input.businessName || 'Business',
    businessLogoUrl: input.businessLogoUrl,
    cardName: input.cardName || 'Loyalty Card',
    cardColor: input.cardColor || '#8B4513',
    iconEmoji: input.iconEmoji || '☕',
    stampsRequired: input.stampsRequired || 10,
    reward: input.reward || input.rewardDescription || 'Reward',
    cardDescription: input.cardDescription
  }
}

export function mapSimpleToPreview(input: Partial<CardLivePreviewData>): CardLivePreviewData {
  return {
    cardType: input.cardType || 'stamp',
    businessName: input.businessName || 'Your Business',
    businessLogoUrl: input.businessLogoUrl,
    cardName: input.cardName || 'Loyalty Card',
    cardColor: input.cardColor || '#8B4513',
    iconEmoji: input.iconEmoji || '☕',
    stampsRequired: input.stampsRequired || 10,
    reward: input.reward,
    totalSessions: input.totalSessions,
    membershipType: input.membershipType,
    cardDescription: input.cardDescription,
  }
}

