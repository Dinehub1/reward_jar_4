// Centralized Apple Wallet pass JSON construction
// Purpose: Provide a single source of truth for Apple pass JSON used by all Apple wallet routes
import { formatCurrency, formatDate } from '@/lib/format'
import { AppleCopy } from '@/lib/wallet/walletCopy'
import { getOptimalBarcodeConfig, getBarcodeStyles } from '@/lib/wallet/barcode-placement'

export type ApplePassInput = {
  customerCardId: string
  isMembershipCard: boolean
  cardData: {
    name: string
    total_stamps?: number
    reward_description?: string
    card_color?: string
  }
  businessData: {
    name: string
    description?: string
  }
  locale?: string
  derived: {
    progressLabel: string
    remainingLabel: string
    primaryValue: string
    progressPercent: number
    remainingCount: number
    isCompleted: boolean
    isExpired?: boolean
    membershipCost?: number
    membershipTotalSessions?: number
    membershipExpiryDate?: string | null
  }
}

export function convertHexToRgbColor(hexColor?: string): string {
  if (!hexColor) return 'rgb(16, 185, 129)'
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'rgb(16, 185, 129)'
}

// Countdown helper functions (Phase 2)
function calculateTimeRemaining(expiryDate: string | Date) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  
  if (diff <= 0) return { expired: true, days: 0, hours: 0 }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  return { expired, days, hours }
}

function formatCountdown(timeRemaining: ReturnType<typeof calculateTimeRemaining>): string {
  const { expired, days, hours } = timeRemaining
  
  if (expired) return 'Expired'
  if (days > 0) return `${days} day${days === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`
  return 'Soon'
}

function generateCountdownFields(input: ApplePassInput): any[] {
  const { isMembershipCard, cardData, derived } = input
  const fields: any[] = []
  
  // Check for membership expiry (membership cards)
  if (isMembershipCard && derived.membershipExpiryDate) {
    const timeRemaining = calculateTimeRemaining(derived.membershipExpiryDate)
    const urgencyThreshold = 14 // days for membership
    
    if (timeRemaining.expired || timeRemaining.days <= urgencyThreshold) {
      fields.push({
        key: 'membership_expiry',
        label: timeRemaining.expired ? 'Membership' : 'Expires',
        value: timeRemaining.expired ? 'Expired' : formatCountdown(timeRemaining),
        textAlignment: 'PKTextAlignmentCenter',
      })
    }
  }
  
  return fields
}

export function buildApplePassJson(input: ApplePassInput) {
  const {
    customerCardId,
    isMembershipCard,
    cardData,
    businessData,
    derived,
  } = input

  const backgroundColor = cardData.card_color
    ? convertHexToRgbColor(cardData.card_color)
    : (isMembershipCard ? 'rgb(99, 102, 241)' : 'rgb(16, 185, 129)')

  // Enhanced: Automatic barcode placement (Phase 2)
  const barcodeConfig = getOptimalBarcodeConfig(
    'apple',
    isMembershipCard ? 'membership' : 'stamp',
    'medium' // Could be dynamic based on card content
  )

  const base = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
    serialNumber: customerCardId,
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
    organizationName: 'RewardJar',
    description: `${cardData.name} - ${businessData.name}`,
    logoText: 'RewardJar',
    backgroundColor,
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)',
    // Enhanced: Platform-optimized barcode
    barcodes: [
      {
        message: customerCardId,
        format: barcodeConfig.type === 'PDF417' ? 'PKBarcodeFormatPDF417' :
                barcodeConfig.type === 'QR_CODE' ? 'PKBarcodeFormatQR' :
                barcodeConfig.type === 'AZTEC' ? 'PKBarcodeFormatAztec' :
                'PKBarcodeFormatCode128',
        messageEncoding: 'iso-8859-1',
        altText: `Card ID: ${customerCardId}`
      }
    ],
    // Legacy barcode support
    barcode: {
      message: customerCardId,
      format: barcodeConfig.type === 'PDF417' ? 'PKBarcodeFormatPDF417' :
              barcodeConfig.type === 'QR_CODE' ? 'PKBarcodeFormatQR' :
              barcodeConfig.type === 'AZTEC' ? 'PKBarcodeFormatAztec' :
              'PKBarcodeFormatCode128',
      messageEncoding: 'iso-8859-1',
      altText: `Card ID: ${customerCardId}`
    }
  } as const

  const storeCard = {
    primaryFields: [
      {
        key: isMembershipCard ? 'sessions' : 'stamps',
        label: derived.progressLabel,
        value: derived.primaryValue,
        textAlignment: 'PKTextAlignmentCenter',
      },
    ],
    secondaryFields: [
      {
        key: 'progress',
        label: AppleCopy.labels.progress,
        value: `${Math.round(derived.progressPercent)}%`,
        textAlignment: 'PKTextAlignmentLeft',
      },
      {
        key: 'remaining',
        label: derived.remainingLabel,
        value: derived.isCompleted
          ? (isMembershipCard ? AppleCopy.status.completedMembership : AppleCopy.status.completedStamp)
          : `${derived.remainingCount} ${isMembershipCard ? 'sessions' : 'stamps'}`,
        textAlignment: 'PKTextAlignmentRight',
      },
    ],
    auxiliaryFields: [
      {
        key: 'business',
        label: AppleCopy.labels.business,
        value: businessData.name,
        textAlignment: 'PKTextAlignmentLeft',
      },
      // Enhanced: Countdown information (Phase 2)
      ...generateCountdownFields(input),
      ...(isMembershipCard
        ? []
        : [
            {
              key: 'reward',
              label: AppleCopy.labels.reward,
              value: cardData.reward_description,
              textAlignment: 'PKTextAlignmentRight',
            },
          ]),
    ],
    headerFields: [
      {
        key: 'card_name',
        label: isMembershipCard ? AppleCopy.labels.membershipHeader : AppleCopy.labels.stampHeader,
        value: cardData.name,
        textAlignment: 'PKTextAlignmentCenter',
      },
    ],
    backFields: [
      {
        key: 'description',
        label: AppleCopy.labels.about,
        value: isMembershipCard
          ? `Gym membership with ${input.derived.membershipTotalSessions ?? 20} sessions.`
          : `Collect ${cardData.total_stamps} stamps to earn: ${cardData.reward_description}`,
      },
      {
        key: 'business_info',
        label: businessData.name,
        value:
          businessData.description ||
          (isMembershipCard
            ? AppleCopy.instructions.membership
            : AppleCopy.instructions.stamp),
      },
      {
        key: 'instructions',
        label: AppleCopy.labels.howToUse,
        value: isMembershipCard
          ? AppleCopy.instructions.membership
          : AppleCopy.instructions.stamp,
      },
      ...((isMembershipCard && input.derived.membershipExpiryDate)
        ? [
            {
              key: 'expiry_info',
        label: AppleCopy.labels.expiresOn,
        value: formatDate(input.derived.membershipExpiryDate as string, input.locale),
            },
          ]
        : []),
      {
        key: 'contact',
        label: AppleCopy.labels.questions,
        value: AppleCopy.support,
      },
    ],
  }

  return {
    ...base,
    storeCard,
  }
}

// Convenience wrapper with simpler signature and optional membership/stamp type
export function buildApplePass(
  cardData: {
    name: string
    total_stamps?: number
    reward_description?: string
    card_color?: string
    total_sessions?: number
    cost?: number
  },
  businessData: { name: string; description?: string },
  customerCardId: string,
  options?: {
    type?: 'membership' | 'stamp'
    derived?: Partial<ApplePassInput['derived']>
  }
) {
  const isMembership = options?.type === 'membership'
  const derivedDefaults: ApplePassInput['derived'] = {
    progressLabel: isMembership ? 'Sessions Used' : 'Stamps Collected',
    remainingLabel: 'Remaining',
    primaryValue: isMembership ? '0/20' : '0/10',
    progressPercent: 0,
    remainingCount: isMembership ? (cardData.total_sessions ?? 20) : (cardData.total_stamps ?? 10),
    isCompleted: false,
    isExpired: false,
    membershipCost: cardData.cost,
    membershipTotalSessions: cardData.total_sessions,
    membershipExpiryDate: null,
  }

  const input: ApplePassInput = {
    customerCardId,
    isMembershipCard: isMembership,
    cardData: {
      name: cardData.name,
      total_stamps: cardData.total_stamps,
      reward_description: cardData.reward_description,
      card_color: cardData.card_color,
    },
    businessData: {
      name: businessData.name,
      description: businessData.description,
    },
    derived: { ...derivedDefaults, ...(options?.derived || {}) },
  }

  const base = buildApplePassJson(input) as any

  // Membership-specific overrides (kept minimal to avoid drift with standard route)
  if (isMembership) {
    if (input.derived.isExpired) {
      base.backgroundColor = 'rgb(239, 68, 68)'
    } else if (input.derived.isCompleted) {
      base.backgroundColor = 'rgb(34, 197, 94)'
    }

    base.barcodes = [
      {
        message: `gym:${customerCardId}`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `Gym Membership ID: ${customerCardId.substring(0, 8)}`,
      },
    ]
  }

  return base
}

