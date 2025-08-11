// Centralized Apple Wallet pass JSON construction
// Purpose: Provide a single source of truth for Apple pass JSON used by all Apple wallet routes

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
        label: 'Progress',
        value: `${Math.round(derived.progressPercent)}%`,
        textAlignment: 'PKTextAlignmentLeft',
      },
      {
        key: 'remaining',
        label: derived.remainingLabel,
        value: derived.isCompleted
          ? (isMembershipCard ? 'Complete' : 'Completed!')
          : `${derived.remainingCount} ${isMembershipCard ? 'sessions' : 'stamps'}`,
        textAlignment: 'PKTextAlignmentRight',
      },
    ],
    auxiliaryFields: [
      {
        key: 'business',
        label: 'Business',
        value: businessData.name,
        textAlignment: 'PKTextAlignmentLeft',
      },
      ...(isMembershipCard
        ? [
            {
              key: 'cost',
              label: 'Value',
              value: `₩${(input.derived.membershipCost ?? 15000).toLocaleString()}`,
              textAlignment: 'PKTextAlignmentRight',
            },
          ]
        : [
            {
              key: 'reward',
              label: 'Reward',
              value: cardData.reward_description,
              textAlignment: 'PKTextAlignmentRight',
            },
          ]),
    ],
    headerFields: [
      {
        key: 'card_name',
        label: isMembershipCard ? 'Membership' : 'Stamp Card',
        value: cardData.name,
        textAlignment: 'PKTextAlignmentCenter',
      },
    ],
    backFields: [
      {
        key: 'description',
        label: 'About',
        value: isMembershipCard
          ? `Gym membership with ${input.derived.membershipTotalSessions ?? 20} sessions. Value: ₩${(input.derived.membershipCost ?? 15000).toLocaleString()}.`
          : `Collect ${cardData.total_stamps} stamps to earn: ${cardData.reward_description}`,
      },
      {
        key: 'business_info',
        label: businessData.name,
        value:
          businessData.description ||
          (isMembershipCard
            ? 'Visit us to use your gym sessions!'
            : 'Visit us to collect stamps and earn rewards!'),
      },
      {
        key: 'instructions',
        label: 'How to Use',
        value: isMembershipCard
          ? 'Show this pass at the gym to mark session usage. Your pass will automatically update when sessions are used.'
          : 'Show this pass to collect stamps at participating locations. Your pass will automatically update when new stamps are added.',
      },
      ...((isMembershipCard && input.derived.membershipExpiryDate)
        ? [
            {
              key: 'expiry_info',
              label: 'Valid Until',
              value: new Date(input.derived.membershipExpiryDate as string).toLocaleDateString(),
            },
          ]
        : []),
      {
        key: 'contact',
        label: 'Questions?',
        value: 'Contact the business directly or visit rewardjar.com for support.',
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

