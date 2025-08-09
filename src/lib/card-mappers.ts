import type { CardLivePreviewData } from '@/components/unified/CardLivePreview'

/**
 * Shared mapping utilities for card creation and live preview.
 * Ensures a single source of truth for:
 * - Building API payloads from form data (quick/unified and advanced)
 * - Converting form or DB rows to CardLivePreviewData
 */

export interface BusinessLite {
  id: string
  name: string
  logo_url?: string
}

function resolveBusiness(
  businesses: BusinessLite[] | undefined,
  businessId?: string
): BusinessLite | undefined {
  if (!businesses || !businessId) return undefined
  return businesses.find(b => b.id === businessId)
}

/**
 * Infers card type from a flexible input shape.
 */
export function inferCardType(input: any): 'stamp' | 'membership' {
  if (input?.cardType === 'membership_card' || input?.cardType === 'membership') return 'membership'
  if (typeof input?.totalSessions === 'number' || input?.membership_type) return 'membership'
  return 'stamp'
}

/**
 * Build creation payload for POST /api/admin/cards from any form-like input.
 * Supports both quick/unified and advanced shapes.
 */
export function buildCreationPayloadFromForm(input: any): Record<string, any> {
  const cardType = inferCardType(input)

  const base = {
    card_name: input.cardName ?? input.card_name,
    business_id: input.businessId ?? input.business_id,
    card_color: input.cardColor ?? input.card_color,
    icon_emoji: input.iconEmoji ?? input.icon_emoji,
    barcode_type: input.barcodeType ?? input.barcode_type ?? 'QR_CODE',
    card_expiry_days: input.cardExpiryDays ?? input.card_expiry_days ?? 60,
    reward_expiry_days: input.rewardExpiryDays ?? input.reward_expiry_days ?? 15
  }

  if (cardType === 'membership') {
    return {
      ...base,
      total_sessions: input.totalSessions ?? input.total_sessions,
      membership_type: input.membershipType ?? input.membership_type,
      cost: input.cost,
      duration_days: input.durationDays ?? input.duration_days,
      how_to_use_card: input.howToUseCard ?? input.how_to_use_card,
      membership_details: input.membershipDetails ?? input.membership_details,
      session_used_message: input.sessionUsedMessage ?? input.session_used_message,
      membership_expired_message: input.membershipExpiredMessage ?? input.membership_expired_message
    }
  }

  return {
    ...base,
    stamps_required: input.stampsRequired ?? input.stamps_required,
    reward: input.reward,
    reward_description: input.rewardDescription ?? input.reward_description,
    how_to_earn_stamp: input.howToEarnStamp ?? input.how_to_earn_stamp,
    reward_details: input.rewardDetails ?? input.reward_details,
    earned_stamp_message: input.earnedStampMessage ?? input.earned_stamp_message,
    earned_reward_message: input.earnedRewardMessage ?? input.earned_reward_message,
    stamp_config: input.stampConfig ?? input.stamp_config
  }
}

/**
 * Convert form-like input to CardLivePreviewData.
 */
export function toPreviewDataFromForm(
  input: any,
  businesses?: BusinessLite[]
): CardLivePreviewData {
  const cardType = inferCardType(input)
  const selectedBusiness = resolveBusiness(businesses, input.businessId ?? input.business_id)

  const base = {
    cardType,
    businessId: input.businessId ?? input.business_id,
    businessName: input.businessName || selectedBusiness?.name || 'Your Business',
    businessLogoUrl: input.businessLogoUrl || selectedBusiness?.logo_url,
    cardName: input.cardName ?? input.card_name ?? 'Your Card',
    cardColor: input.cardColor ?? input.card_color ?? '#7c3aed',
    iconEmoji: input.iconEmoji ?? input.icon_emoji ?? '⭐',
    cardDescription: input.cardDescription ?? input.card_description
  }

  if (cardType === 'membership') {
    return {
      ...base,
      totalSessions: input.totalSessions ?? input.total_sessions ?? 10,
      membershipType: input.membershipType ?? input.membership_type,
      cost: input.cost,
      durationDays: input.durationDays ?? input.duration_days,
      howToUseCard: input.howToUseCard ?? input.how_to_use_card,
      membershipDetails: input.membershipDetails ?? input.membership_details,
      sessionUsedMessage: input.sessionUsedMessage ?? input.session_used_message,
      membershipExpiredMessage: input.membershipExpiredMessage ?? input.membership_expired_message
    }
  }

  return {
    ...base,
    stampsRequired: input.stampsRequired ?? input.stamps_required ?? 10,
    reward: input.reward,
    rewardDescription: input.rewardDescription ?? input.reward_description,
    howToEarnStamp: input.howToEarnStamp ?? input.how_to_earn_stamp,
    rewardDetails: input.rewardDetails ?? input.reward_details,
    earnedStampMessage: input.earnedStampMessage ?? input.earned_stamp_message,
    earnedRewardMessage: input.earnedRewardMessage ?? input.earned_reward_message
  }
}

/**
 * Convert a database row (joined with business if available) to CardLivePreviewData.
 */
export function toPreviewDataFromDb(row: any): CardLivePreviewData {
  const cardType: 'stamp' | 'membership' = (row?.total_sessions || row?.membership_type) ? 'membership' : 'stamp'

  const base = {
    cardType,
    businessId: row.business_id,
    businessName: row.businesses?.name || row.business?.name || row.business_name || 'Your Business',
    businessLogoUrl: row.businesses?.logo_url || row.business?.logo_url,
    cardName: row.card_name || row.name,
    cardColor: row.card_color,
    iconEmoji: row.icon_emoji || '⭐',
    cardDescription: row.card_description
  }

  if (cardType === 'membership') {
    return {
      ...base,
      totalSessions: row.total_sessions,
      membershipType: row.membership_type,
      cost: row.cost,
      durationDays: row.duration_days,
      howToUseCard: row.how_to_use_card,
      membershipDetails: row.membership_details,
      sessionUsedMessage: row.session_used_message,
      membershipExpiredMessage: row.membership_expired_message
    }
  }

  return {
    ...base,
    stampsRequired: row.stamps_required || row.total_stamps,
    reward: row.reward,
    rewardDescription: row.reward_description,
    howToEarnStamp: row.how_to_earn_stamp,
    rewardDetails: row.reward_details,
    earnedStampMessage: row.earned_stamp_message,
    earnedRewardMessage: row.earned_reward_message
  }
}

