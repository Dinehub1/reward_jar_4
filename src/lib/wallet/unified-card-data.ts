/**
 * Unified Card Data System for RewardJar 4.0
 * 
 * Single source of truth for card data transformation across:
 * - Apple Wallet (.pkpass)
 * - Google Wallet (JWT)
 * - PWA (Progressive Web App)
 * 
 * Ensures identical data across all platforms with type safety.
 */

import type { Database } from '@/lib/supabase/types'

// Base types from Supabase
type StampCard = Database['public']['Tables']['stamp_cards']['Row']
type MembershipCard = Database['public']['Tables']['membership_cards']['Row']
type Business = Database['public']['Tables']['businesses']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

// Unified card data structure
export interface UnifiedCardData {
  // Core identification
  id: string
  type: 'stamp' | 'membership'
  serialNumber: string
  
  // Business information
  business: {
    id: string
    name: string
    email: string
    description?: string
    logoUrl?: string
    address?: string
    phone?: string
  }
  
  // Card details
  card: {
    name: string
    description: string
    backgroundColor: string
    foregroundColor: string
    labelColor: string
    logoText?: string
  }
  
  // Type-specific data
  stampCard?: {
    totalStamps: number
    currentStamps: number
    rewardDescription: string
    progress: number // 0-1
  }
  
  membershipCard?: {
    membershipType: string
    totalSessions: number
    sessionsUsed: number
    cost: number
    durationDays: number
    expiryDate: string
    benefits: string[]
  }
  
  // Customer data (when generating for specific customer)
  customer?: {
    id: string
    name?: string
    email: string
    memberSince: string
  }
  
  // Barcode data
  barcode: {
    type: 'QR_CODE' | 'PKBarcodeFormatQR'
    value: string
    alternateText: string
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
  expiresAt?: string
  
  // Metadata
  version: number
  status: 'active' | 'inactive' | 'expired'
}

/**
 * Transform Supabase stamp card data to unified format
 */
export function transformStampCardData(
  stampCard: StampCard & { businesses?: Business },
  customer?: Customer & { current_stamps?: number }
): UnifiedCardData {
  const business = stampCard.businesses
  const currentStamps = customer?.current_stamps || 0
  const progress = stampCard.stamps_required > 0 ? currentStamps / stampCard.stamps_required : 0
  
  return {
    id: stampCard.id,
    type: 'stamp',
    serialNumber: `STAMP-${stampCard.id}-${Date.now()}`,
    
    business: {
      id: business?.id || '',
      name: business?.name || 'Unknown Business',
      email: business?.contact_email || '',
      description: business?.description,
      logoUrl: business?.logo_url,
      address: business?.address,
      phone: business?.phone
    },
    
    card: {
      name: stampCard.card_name,
      description: stampCard.reward_description || 'Loyalty Card',
      backgroundColor: 'rgb(139, 92, 246)', // Purple theme
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(255, 255, 255)',
      logoText: business?.name
    },
    
    stampCard: {
      totalStamps: stampCard.stamps_required,
      currentStamps,
      rewardDescription: stampCard.reward_description || 'Reward available!',
      progress
    },
    
    customer: customer ? {
      id: customer.id,
      name: customer.name || undefined,
      email: customer.email || '',
      memberSince: customer.created_at
    } : undefined,
    
    barcode: {
      type: 'QR_CODE',
      value: `REWARDJAR-STAMP-${stampCard.id}-${customer?.id || 'TEMPLATE'}`,
      alternateText: `Stamp Card ${stampCard.id}`
    },
    
    createdAt: stampCard.created_at,
    updatedAt: stampCard.updated_at || stampCard.created_at,
    
    version: 1,
    status: stampCard.status as 'active' | 'inactive'
  }
}

/**
 * Transform Supabase membership card data to unified format
 */
export function transformMembershipCardData(
  membershipCard: MembershipCard & { businesses?: Business },
  customer?: Customer & { sessions_used?: number; expiry_date?: string }
): UnifiedCardData {
  const business = membershipCard.businesses
  const sessionsUsed = customer?.sessions_used || 0
  const durationDays = membershipCard.duration_days || 30
  const expiryDate = customer?.expiry_date || new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
  
  return {
    id: membershipCard.id,
    type: 'membership',
    serialNumber: `MEMBER-${membershipCard.id}-${Date.now()}`,
    
    business: {
      id: business?.id || '',
      name: business?.name || 'Unknown Business',
      email: business?.contact_email || '',
      description: business?.description,
      logoUrl: business?.logo_url,
      address: business?.address,
      phone: business?.phone
    },
    
    card: {
      name: membershipCard.name,
      description: `${membershipCard.total_sessions} sessions membership`,
      backgroundColor: 'rgb(34, 197, 94)', // Green theme
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(255, 255, 255)',
      logoText: business?.name
    },
    
    membershipCard: {
      membershipType: membershipCard.membership_type || 'standard',
      totalSessions: membershipCard.total_sessions,
      sessionsUsed,
      cost: membershipCard.cost,
      durationDays: durationDays,
      expiryDate,
      benefits: [
        `${membershipCard.total_sessions} total sessions`,
        `Valid for ${durationDays} days`,
        'Access to all facilities'
      ]
    },
    
    customer: customer ? {
      id: customer.id,
      name: customer.name || undefined,
      email: customer.email || '',
      memberSince: customer.created_at
    } : undefined,
    
    barcode: {
      type: 'QR_CODE',
      value: `REWARDJAR-MEMBER-${membershipCard.id}-${customer?.id || 'TEMPLATE'}`,
      alternateText: `Membership ${membershipCard.id}`
    },
    
    createdAt: membershipCard.created_at,
    updatedAt: membershipCard.updated_at || membershipCard.created_at,
    expiresAt: expiryDate,
    
    version: 1,
    status: membershipCard.status as 'active' | 'inactive'
  }
}

/**
 * Generate Apple Wallet pass data from unified card data
 */
export function generateAppleWalletPass(cardData: UnifiedCardData): any {
  const basePass = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.com.rewardjar.loyaltycard',
    serialNumber: cardData.serialNumber,
    teamIdentifier: process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID',
    organizationName: cardData.business.name,
    description: cardData.card.description,
    backgroundColor: cardData.card.backgroundColor,
    foregroundColor: cardData.card.foregroundColor,
    labelColor: cardData.card.labelColor,
    logoText: cardData.card.logoText,
    
    barcodes: [
      {
        message: cardData.barcode.value,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }
    ],
    
    associatedStoreIdentifiers: [],
    
    // Common back fields
    backFields: [
      {
        key: 'business-info',
        label: 'Business',
        value: cardData.business.name
      },
      {
        key: 'created',
        label: 'Created',
        value: new Date(cardData.createdAt).toLocaleDateString()
      }
    ]
  }
  
  if (cardData.type === 'stamp') {
    const stampData = cardData.stampCard!
    return {
      ...basePass,
      storeCard: {
        primaryFields: [
          {
            key: 'stamps',
            label: 'Stamps',
            value: `${stampData.currentStamps} of ${stampData.totalStamps}`
          }
        ],
        secondaryFields: [
          {
            key: 'reward',
            label: 'Reward',
            value: stampData.rewardDescription
          }
        ],
        auxiliaryFields: [
          {
            key: 'progress',
            label: 'Progress',
            value: `${Math.round(stampData.progress * 100)}%`
          }
        ],
        backFields: [
          ...basePass.backFields,
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: `Collect ${stampData.totalStamps} stamps to earn: ${stampData.rewardDescription}`
          }
        ]
      }
    }
  } else {
    const memberData = cardData.membershipCard!
    return {
      ...basePass,
      generic: {
        primaryFields: [
          {
            key: 'membership',
            label: 'Membership',
            value: memberData.membershipType.charAt(0).toUpperCase() + memberData.membershipType.slice(1)
          }
        ],
        secondaryFields: [
          {
            key: 'sessions',
            label: 'Sessions',
            value: `${memberData.sessionsUsed}/${memberData.totalSessions}`
          },
          {
            key: 'expires',
            label: 'Expires',
            value: new Date(memberData.expiryDate).toLocaleDateString()
          }
        ],
        backFields: [
          ...basePass.backFields,
          {
            key: 'benefits',
            label: 'Benefits',
            value: memberData.benefits.join(', ')
          },
          {
            key: 'cost',
            label: 'Cost',
            value: `$${memberData.cost}`
          }
        ]
      }
    }
  }
}

/**
 * Generate Google Wallet object from unified card data
 */
export function generateGoogleWalletObject(cardData: UnifiedCardData): any {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'test-issuer'
  
  if (cardData.type === 'stamp') {
    const stampData = cardData.stampCard!
    return {
      id: `${issuerId}.${cardData.serialNumber}`,
      classId: `${issuerId}.stamp-card-class`,
      state: 'ACTIVE',
      
      barcode: {
        type: 'QR_CODE',
        value: cardData.barcode.value,
        alternateText: cardData.barcode.alternateText
      },
      
      accountId: cardData.customer?.id || 'template-account',
      accountName: cardData.customer?.name || 'Valued Customer',
      
      loyaltyPoints: {
        balance: {
          string: `${stampData.currentStamps} of ${stampData.totalStamps} stamps`
        },
        label: 'Stamps Collected'
      },
      
      textModulesData: [
        {
          header: 'Reward',
          body: stampData.rewardDescription,
          id: 'reward-info'
        },
        {
          header: 'Progress',
          body: `${Math.round(stampData.progress * 100)}% complete`,
          id: 'progress-info'
        },
        {
          header: 'Business',
          body: cardData.business.name,
          id: 'business-info'
        }
      ]
    }
  } else {
    const memberData = cardData.membershipCard!
    return {
      id: `${issuerId}.${cardData.serialNumber}`,
      classId: `${issuerId}.membership-card-class`,
      state: 'ACTIVE',
      
      barcode: {
        type: 'QR_CODE',
        value: cardData.barcode.value,
        alternateText: cardData.barcode.alternateText
      },
      
      cardTitle: {
        defaultValue: {
          language: 'en-US',
          value: `${memberData.membershipType.charAt(0).toUpperCase() + memberData.membershipType.slice(1)} Membership`
        }
      },
      
      header: {
        defaultValue: {
          language: 'en-US',
          value: cardData.business.name
        }
      },
      
      textModulesData: [
        {
          header: 'Sessions',
          body: `${memberData.sessionsUsed}/${memberData.totalSessions} used`,
          id: 'sessions-info'
        },
        {
          header: 'Expires',
          body: new Date(memberData.expiryDate).toLocaleDateString(),
          id: 'expiry-info'
        },
        {
          header: 'Benefits',
          body: memberData.benefits.join(', '),
          id: 'benefits-info'
        }
      ]
    }
  }
}

/**
 * Generate PWA card data from unified card data
 */
export function generatePWACardData(cardData: UnifiedCardData): any {
  return {
    id: cardData.id,
    type: cardData.type,
    serialNumber: cardData.serialNumber,
    
    // Display information
    title: cardData.card.name,
    subtitle: cardData.business.name,
    description: cardData.card.description,
    
    // Visual styling
    theme: {
      backgroundColor: cardData.card.backgroundColor,
      foregroundColor: cardData.card.foregroundColor,
      labelColor: cardData.card.labelColor
    },
    
    // Business info
    business: cardData.business,
    
    // Card-specific data
    cardData: cardData.type === 'stamp' ? cardData.stampCard : cardData.membershipCard,
    
    // Interactive elements
    barcode: {
      type: 'qr',
      value: cardData.barcode.value,
      displayValue: cardData.barcode.alternateText
    },
    
    // Actions available in PWA
    actions: [
      {
        id: 'scan',
        label: 'Scan QR Code',
        icon: 'qr-code',
        primary: true
      },
      {
        id: 'share',
        label: 'Share',
        icon: 'share'
      },
      {
        id: 'details',
        label: 'View Details',
        icon: 'info'
      }
    ],
    
    // Metadata
    meta: {
      version: cardData.version,
      status: cardData.status,
      createdAt: cardData.createdAt,
      updatedAt: cardData.updatedAt,
      expiresAt: cardData.expiresAt
    }
  }
}

/**
 * Validate unified card data for completeness
 */
export function validateCardData(cardData: UnifiedCardData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!cardData.id) errors.push('Card ID is required')
  if (!cardData.serialNumber) errors.push('Serial number is required')
  if (!cardData.business.name) errors.push('Business name is required')
  if (!cardData.card.name) errors.push('Card name is required')
  if (!cardData.barcode.value) errors.push('Barcode value is required')
  
  // Type-specific validation
  if (cardData.type === 'stamp' && !cardData.stampCard) {
    errors.push('Stamp card data is required for stamp cards')
  }
  
  if (cardData.type === 'membership' && !cardData.membershipCard) {
    errors.push('Membership card data is required for membership cards')
  }
  
  // Business validation
  if (!cardData.business.email) errors.push('Business email is required')
  
  return {
    valid: errors.length === 0,
    errors
  }
}