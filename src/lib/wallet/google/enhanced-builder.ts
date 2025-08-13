/**
 * Enhanced Google Wallet Pass Builder
 * Production-ready implementation with full compliance
 */

import { GoogleWalletCompliance } from './compliance'
import type { StampCard, MembershipCard, Business, Customer, CustomerCard } from '@/lib/types/supabase'

export interface EnhancedGoogleWalletConfig {
  serviceAccountEmail?: string
  privateKey?: string
  issuerId?: string
  environment?: 'development' | 'staging' | 'production'
  classSuffix?: {
    stamp?: string
    membership?: string
  }
}

export interface GoogleWalletPassData {
  customerCard: CustomerCard & {
    stamp_card?: StampCard
    membership_card?: MembershipCard
    customer?: Customer
  }
  business: Business
  cardType: 'stamp' | 'membership'
}

export interface GoogleWalletLoyaltyClass {
  id: string
  issuerName: string
  reviewStatus: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  programName: string
  programLogo?: {
    sourceUri: {
      uri: string
    }
    contentDescription: {
      defaultValue: {
        language: string
        value: string
      }
    }
  }
  accountIdLabel: string
  accountNameLabel: string
  programDetails?: string
  rewardsTier?: string
  rewardsTierLabel?: string
  localizedIssuerName?: {
    defaultValue: {
      language: string
      value: string
    }
  }
  heroImage?: {
    sourceUri: {
      uri: string
    }
    contentDescription: {
      defaultValue: {
        language: string
        value: string
      }
    }
  }
  hexBackgroundColor?: string
  allowMultipleUsersPerObject?: boolean
  locations?: Array<{
    latitude: number
    longitude: number
  }>
  messages?: Array<{
    header: string
    body: string
    id: string
    messageType: 'MESSAGE_TYPE_DISPLAY_INTERVAL' | 'MESSAGE_TYPE_UNKNOWN'
    displayInterval?: {
      start: {
        date: string
      }
      end: {
        date: string
      }
    }
  }>
  textModulesData?: Array<{
    id: string
    header: string
    body: string
  }>
  linksModuleData?: {
    uris: Array<{
      id: string
      uri: string
      description: string
    }>
  }
  imageModulesData?: Array<{
    id: string
    mainImage: {
      sourceUri: {
        uri: string
      }
      contentDescription: {
        defaultValue: {
          language: string
          value: string
        }
      }
    }
  }>
  callbackOptions?: {
    updateRequestUrl: string
    url: string
  }
  securityAnimation?: {
    animationType: 'FOIL_SHIMMER'
  }
  wordMark?: {
    sourceUri: {
      uri: string
    }
  }
}

export interface GoogleWalletLoyaltyObject {
  id: string
  classId: string
  state: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'COMPLETED'
  barcode?: {
    type: 'QR_CODE' | 'PDF_417' | 'AZTEC' | 'CODE_128' | 'CODE_39'
    value: string
    alternateText?: string
  }
  accountId: string
  accountName: string
  loyaltyPoints?: {
    label: string
    balance: {
      string: string
      int?: number
    }
    localizedLabel?: {
      defaultValue: {
        language: string
        value: string
      }
    }
  }
  secondaryLoyaltyPoints?: {
    label: string
    balance: {
      string: string
      int?: number
    }
  }
  messages?: Array<{
    header?: string
    body?: string
    id: string
    messageType: 'MESSAGE_TYPE_DISPLAY_INTERVAL' | 'MESSAGE_TYPE_UNKNOWN'
    displayInterval?: {
      start: {
        date: string
      }
      end: {
        date: string
      }
    }
  }>
  textModulesData?: Array<{
    id: string
    header: string
    body: string
  }>
  linksModuleData?: {
    uris: Array<{
      id: string
      uri: string
      description: string
    }>
  }
  imageModulesData?: Array<{
    id: string
    mainImage: {
      sourceUri: {
        uri: string
      }
      contentDescription: {
        defaultValue: {
          language: string
          value: string
        }
      }
    }
  }>
  rotatingBarcode?: {
    type: 'QR_CODE'
    valuePattern: string
    totpDetails: {
      periodMillis: string
      algorithm: string
      parameters: Array<{
        key: string
        value: string
      }>
    }
    alternateText?: string
  }
  appLinkData?: {
    androidAppLinkInfo?: {
      appTarget: {
        packageName: string
        environment: 'SANDBOX' | 'PRODUCTION'
      }
    }
    webAppLinkInfo?: {
      appTarget: {
        targetUri: {
          uri: string
          description: string
        }
      }
    }
  }
  locations?: Array<{
    latitude: number
    longitude: number
    kind: string
  }>
  hasUsers?: boolean
  smartTapRedemptionValue?: string
  hasLinkedDevice?: boolean
  disableExpirationNotification?: boolean
  validTimeInterval?: {
    start?: {
      date: string
    }
    end?: {
      date: string
    }
  }
  groupingInfo?: {
    groupingId: string
    sortIndex?: number
  }
  passConstraints?: {
    screenshotEligibility: 'SCREENSHOT_ELIGIBILITY_ELIGIBLE' | 'SCREENSHOT_ELIGIBILITY_INELIGIBLE'
    nfcConstraint: Array<'NFC_CONSTRAINT_BLOCK_PAYMENT' | 'NFC_CONSTRAINT_BLOCK_CLOSED_LOOP_TRANSIT'>
  }
  heroImage?: {
    sourceUri: {
      uri: string
    }
    contentDescription: {
      defaultValue: {
        language: string
        value: string
      }
    }
  }
  notifyPreference?: 'NOTIFICATION_SETTINGS_FOR_UPDATES'
}

/**
 * Enhanced Google Wallet Pass Builder
 * Implements Google's latest API standards and production requirements
 */
export class EnhancedGoogleWalletBuilder {
  private compliance: GoogleWalletCompliance
  private config: EnhancedGoogleWalletConfig

  constructor(config: EnhancedGoogleWalletConfig = {}) {
    this.config = {
      serviceAccountEmail: config.serviceAccountEmail || process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
      privateKey: config.privateKey || process.env.GOOGLE_WALLET_PRIVATE_KEY,
      issuerId: config.issuerId || process.env.GOOGLE_WALLET_ISSUER_ID,
      environment: config.environment || (process.env.NODE_ENV as any) || 'development',
      classSuffix: {
        stamp: config.classSuffix?.stamp || process.env.GOOGLE_WALLET_CLASS_SUFFIX_STAMP || 'rewardjar_stamp_v2',
        membership: config.classSuffix?.membership || process.env.GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP || 'rewardjar_membership_v2'
      }
    }

    this.compliance = new GoogleWalletCompliance(this.config, {
      validateFields: true,
      enforceSecurityStandards: this.config.environment === 'production',
      enableAnalytics: true,
      requireHttps: this.config.environment === 'production',
      maxRetries: 3,
      requestTimeout: 10000
    })
  }

  /**
   * Build complete Google Wallet loyalty class
   */
  public buildLoyaltyClass(data: GoogleWalletPassData): GoogleWalletLoyaltyClass {
    const { business, cardType } = data
    const classId = this.compliance.generateClassId(
      this.config.classSuffix![cardType]!,
      'loyalty'
    )

    const loyaltyClass: GoogleWalletLoyaltyClass = {
      id: classId,
      issuerName: business.name,
      reviewStatus: 'UNDER_REVIEW',
      programName: cardType === 'stamp' ? 'Loyalty Program' : 'Membership Program',
      accountIdLabel: 'Card ID',
      accountNameLabel: 'Member Name',
      allowMultipleUsersPerObject: false,
      hexBackgroundColor: this.sanitizeHexColor(
        cardType === 'stamp' 
          ? data.customerCard.stamp_card?.card_color 
          : data.customerCard.membership_card?.card_color
      ),
      localizedIssuerName: {
        defaultValue: {
          language: business.locale?.split('-')[0] || 'en',
          value: business.name
        }
      }
    }

    // Add program logo if available
    if (business.logo_url) {
      loyaltyClass.programLogo = {
        sourceUri: {
          uri: business.logo_url
        },
        contentDescription: {
          defaultValue: {
            language: business.locale?.split('-')[0] || 'en',
            value: `${business.name} logo`
          }
        }
      }
    }

    // Add location if available
    if (business.latitude && business.longitude) {
      loyaltyClass.locations = [{
        latitude: parseFloat(business.latitude.toString()),
        longitude: parseFloat(business.longitude.toString())
      }]
    }

    // Add business details
    if (business.description) {
      loyaltyClass.programDetails = business.description
    }

    // Add contact information
    const contactUris = []
    if (business.website_url) {
      contactUris.push({
        id: 'website',
        uri: business.website_url,
        description: 'Visit our website'
      })
    }
    if (business.contact_email) {
      contactUris.push({
        id: 'email',
        uri: `mailto:${business.contact_email}`,
        description: 'Contact us'
      })
    }
    if (business.contact_number) {
      contactUris.push({
        id: 'phone',
        uri: `tel:${business.contact_number}`,
        description: 'Call us'
      })
    }

    if (contactUris.length > 0) {
      loyaltyClass.linksModuleData = { uris: contactUris }
    }

    // Add card-specific details
    if (cardType === 'stamp' && data.customerCard.stamp_card) {
      const stampCard = data.customerCard.stamp_card
      loyaltyClass.textModulesData = [
        {
          id: 'reward_info',
          header: 'Reward',
          body: stampCard.reward_description || 'Collect stamps to earn rewards'
        },
        {
          id: 'how_to_earn',
          header: 'How to Earn',
          body: stampCard.how_to_earn_stamp || 'Purchase items to earn stamps'
        }
      ]
    } else if (cardType === 'membership' && data.customerCard.membership_card) {
      const membershipCard = data.customerCard.membership_card
      loyaltyClass.textModulesData = [
        {
          id: 'membership_info',
          header: 'Membership Details',
          body: membershipCard.membership_details || 'Premium membership benefits'
        },
        {
          id: 'how_to_use',
          header: 'How to Use',
          body: membershipCard.how_to_use_card || 'Show this card for access'
        }
      ]
    }

    return loyaltyClass
  }

  /**
   * Build complete Google Wallet loyalty object
   */
  public buildLoyaltyObject(data: GoogleWalletPassData): GoogleWalletLoyaltyObject {
    const { customerCard, business, cardType } = data
    const classId = this.compliance.generateClassId(
      this.config.classSuffix![cardType]!,
      'loyalty'
    )
    const objectId = this.compliance.generateObjectId(classId, customerCard.id)

    const loyaltyObject: GoogleWalletLoyaltyObject = {
      id: objectId,
      classId: classId,
      state: this.determineCardState(customerCard, cardType),
      accountId: customerCard.id.substring(0, 20),
      accountName: customerCard.customer?.name || 'Valued Customer',
      barcode: {
        type: cardType === 'stamp' 
          ? (customerCard.stamp_card?.barcode_type as any) || 'QR_CODE'
          : (customerCard.membership_card?.barcode_type as any) || 'QR_CODE',
        value: customerCard.id,
        alternateText: customerCard.id.substring(0, 20)
      }
    }

    // Add points/progress information
    if (cardType === 'stamp' && customerCard.stamp_card) {
      const current = customerCard.current_stamps || 0
      const total = customerCard.stamp_card.stamps_required || customerCard.stamp_card.total_stamps || 10
      
      loyaltyObject.loyaltyPoints = {
        label: 'Stamps',
        balance: {
          string: `${current}/${total}`,
          int: current
        },
        localizedLabel: {
          defaultValue: {
            language: business.locale?.split('-')[0] || 'en',
            value: 'Stamps Collected'
          }
        }
      }
    } else if (cardType === 'membership' && customerCard.membership_card) {
      const used = customerCard.sessions_used || 0
      const total = customerCard.membership_card.total_sessions || 0
      
      loyaltyObject.loyaltyPoints = {
        label: 'Sessions',
        balance: {
          string: `${used}/${total}`,
          int: used
        },
        localizedLabel: {
          defaultValue: {
            language: business.locale?.split('-')[0] || 'en',
            value: 'Sessions Used'
          }
        }
      }

      // Add remaining sessions as secondary points
      loyaltyObject.secondaryLoyaltyPoints = {
        label: 'Remaining',
        balance: {
          string: `${Math.max(0, total - used)}`,
          int: Math.max(0, total - used)
        }
      }
    }

    // Add expiry information if available
    if (customerCard.expiry_date) {
      const expiryDate = new Date(customerCard.expiry_date)
      const now = new Date()
      
      if (expiryDate > now) {
        loyaltyObject.validTimeInterval = {
          end: {
            date: expiryDate.toISOString().split('T')[0]
          }
        }
      }

      // Add expiry warning message
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        loyaltyObject.messages = [{
          id: 'expiry_warning',
          header: 'Expires Soon',
          body: `This card expires in ${daysUntilExpiry} days`,
          messageType: 'MESSAGE_TYPE_DISPLAY_INTERVAL'
        }]
      }
    }

    // Add business location for geo-targeting
    if (business.latitude && business.longitude) {
      loyaltyObject.locations = [{
        latitude: parseFloat(business.latitude.toString()),
        longitude: parseFloat(business.longitude.toString()),
        kind: 'business'
      }]
    }

    // Add app link data for deep linking
    loyaltyObject.appLinkData = {
      webAppLinkInfo: {
        appTarget: {
          targetUri: {
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/card/${customerCard.id}`,
            description: 'View card details'
          }
        }
      }
    }

    // Security and constraints
    loyaltyObject.passConstraints = {
      screenshotEligibility: 'SCREENSHOT_ELIGIBILITY_ELIGIBLE',
      nfcConstraint: []
    }

    loyaltyObject.notifyPreference = 'NOTIFICATION_SETTINGS_FOR_UPDATES'

    return loyaltyObject
  }

  /**
   * Create complete Google Wallet pass with class and object
   */
  public async createCompletePass(data: GoogleWalletPassData): Promise<{
    success: boolean
    classId: string
    objectId: string
    saveUrl: string
    jwt: string
  }> {
    try {
      // Build class and object
      const loyaltyClass = this.buildLoyaltyClass(data)
      const loyaltyObject = this.buildLoyaltyObject(data)

      // Create or update class
      const classResult = await this.compliance.createOrUpdateLoyaltyClass(loyaltyClass)
      
      // Create or update object
      const objectResult = await this.compliance.createOrUpdateLoyaltyObject(loyaltyObject)

      // Create JWT for Save to Google Wallet
      const jwt = this.compliance.createSaveToWalletJWT([loyaltyObject])
      const saveUrl = this.compliance.generateSaveUrl(jwt)

      return {
        success: true,
        classId: classResult.classId,
        objectId: objectResult.objectId,
        saveUrl,
        jwt
      }

    } catch (error) {
      console.error('Failed to create Google Wallet pass:', error)
      throw new Error(`Failed to create Google Wallet pass: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get health status of Google Wallet integration
   */
  public async getHealthStatus() {
    return await this.compliance.healthCheck()
  }

  /**
   * Validate production readiness
   */
  public validateProductionReadiness() {
    return this.compliance.validateProductionReadiness()
  }

  /**
   * Helper methods
   */
  private sanitizeHexColor(color?: string): string {
    if (!color) return '#2563eb' // Default blue
    
    // Ensure it starts with # and is valid hex
    const cleanColor = color.startsWith('#') ? color : `#${color}`
    const hexRegex = /^#[0-9A-F]{6}$/i
    
    return hexRegex.test(cleanColor) ? cleanColor : '#2563eb'
  }

  private determineCardState(customerCard: CustomerCard, cardType: 'stamp' | 'membership'): 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'COMPLETED' {
    // Check expiry
    if (customerCard.expiry_date) {
      const now = new Date()
      const expiry = new Date(customerCard.expiry_date)
      if (expiry < now) {
        return 'EXPIRED'
      }
    }

    // Check completion
    if (cardType === 'stamp' && customerCard.stamp_card) {
      const current = customerCard.current_stamps || 0
      const required = customerCard.stamp_card.stamps_required || customerCard.stamp_card.total_stamps || 10
      if (current >= required) {
        return 'COMPLETED'
      }
    } else if (cardType === 'membership' && customerCard.membership_card) {
      const used = customerCard.sessions_used || 0
      const total = customerCard.membership_card.total_sessions || 0
      if (used >= total) {
        return 'COMPLETED'
      }
    }

    return 'ACTIVE'
  }
}

export default EnhancedGoogleWalletBuilder