/**
 * 🔧 FIELD MAPPING UTILITY - RewardJar 4.0
 * 
 * Handles field name inconsistencies between legacy and canonical schemas
 * Ensures data consistency across all API endpoints
 */

export interface LegacyCardData {
  // Legacy field names (from old forms/APIs)
  cardName?: string
  businessId?: string
  stampsRequired?: number
  cardColor?: string
  iconEmoji?: string
  barcodeType?: string
  cardExpiryDays?: number
  rewardExpiryDays?: number
  stampConfig?: any
  name?: string
  total_stamps?: number
  expiry_days?: number
}

export interface CanonicalCardData {
  // Canonical field names (new schema)
  card_name: string
  business_id: string
  stamps_required: number
  card_color: string
  icon_emoji: string
  barcode_type: string
  card_expiry_days: number
  reward_expiry_days: number
  stamp_config: any
}

export interface DatabaseCardPayload {
  // Database payload with BOTH legacy and canonical fields
  business_id: string
  
  // Name fields (both required for compatibility)
  name: string                    // Legacy field (required by database constraint)
  card_name: string              // Canonical field
  
  // Stamps fields (both required for compatibility)
  total_stamps: number           // Legacy field (required by database)
  stamps_required: number        // Canonical field
  
  // Expiry fields (both required for compatibility)
  expiry_days: number           // Legacy field
  card_expiry_days: number      // Canonical field
  
  // Other fields
  reward: string
  reward_description: string
  card_color: string
  icon_emoji: string
  barcode_type: string
  reward_expiry_days: number
  stamp_config: any
  card_description: string
  how_to_earn_stamp: string
  reward_details: string
  earned_stamp_message: string
  earned_reward_message: string
  status: string
}

/**
 * Normalizes card data from any format (legacy or canonical) to canonical format
 */
export function normalizeCardData(input: any): CanonicalCardData {
  return {
    card_name: input.card_name || input.cardName || input.name || '',
    business_id: input.business_id || input.businessId || '',
    stamps_required: input.stamps_required || input.stampsRequired || input.total_stamps || input.values?.total_stamps || 0,
    card_color: input.card_color || input.cardColor || '#8B4513',
    icon_emoji: input.icon_emoji || input.iconEmoji || '☕',
    barcode_type: input.barcode_type || input.barcodeType || 'QR_CODE',
    card_expiry_days: input.card_expiry_days || input.cardExpiryDays || input.expiry_days || 60,
    reward_expiry_days: input.reward_expiry_days || input.rewardExpiryDays || 15,
    stamp_config: input.stamp_config || input.stampConfig || {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '12h'
    }
  }
}

/**
 * Creates database payload with BOTH legacy and canonical fields
 * This ensures compatibility with existing database constraints
 */
export function createDatabasePayload(
  canonicalData: CanonicalCardData,
  additionalData: any = {}
): DatabaseCardPayload {
  return {
    business_id: canonicalData.business_id,
    
    // ✅ CRITICAL: Populate BOTH legacy and canonical name fields
    name: canonicalData.card_name,                    // Legacy field (required by DB constraint)
    card_name: canonicalData.card_name,              // Canonical field
    
    // ✅ CRITICAL: Populate BOTH legacy and canonical stamps fields  
    total_stamps: canonicalData.stamps_required,     // Legacy field (required by DB)
    stamps_required: canonicalData.stamps_required,  // Canonical field
    
    // ✅ CRITICAL: Populate BOTH legacy and canonical expiry fields
    expiry_days: canonicalData.card_expiry_days,     // Legacy field
    card_expiry_days: canonicalData.card_expiry_days, // Canonical field
    
    // Other required fields
    reward: additionalData.reward || '',
    reward_description: additionalData.reward_description || '',
    card_color: canonicalData.card_color,
    icon_emoji: canonicalData.icon_emoji,
    barcode_type: canonicalData.barcode_type,
    reward_expiry_days: canonicalData.reward_expiry_days,
    stamp_config: canonicalData.stamp_config,
    card_description: additionalData.card_description || 'Collect stamps to get rewards',
    how_to_earn_stamp: additionalData.how_to_earn_stamp || 'Buy anything to get a stamp',
    reward_details: additionalData.reward_details || '',
    earned_stamp_message: additionalData.earned_stamp_message || 'Just [#] more stamps to get your reward!',
    earned_reward_message: additionalData.earned_reward_message || 'Reward is earned and waiting for you!',
    status: additionalData.status || 'active'
  }
}

/**
 * Normalizes database response to canonical format
 * Handles both legacy and canonical field names from database
 */
export function normalizeDatabaseResponse(dbRow: any): any {
  if (!dbRow) return null
  
  return {
    ...dbRow,
    // Ensure canonical fields are present
    card_name: dbRow.card_name || dbRow.name,
    stamps_required: dbRow.stamps_required || dbRow.total_stamps,
    card_expiry_days: dbRow.card_expiry_days || dbRow.expiry_days,
    
    // Keep legacy fields for backward compatibility
    name: dbRow.name || dbRow.card_name,
    total_stamps: dbRow.total_stamps || dbRow.stamps_required,
    expiry_days: dbRow.expiry_days || dbRow.card_expiry_days
  }
}

/**
 * Field mapping constants for consistent API responses
 */
export const FIELD_MAPPINGS = {
  // Card name mappings
  CARD_NAME: {
    canonical: 'card_name',
    legacy: ['name', 'cardName']
  },
  
  // Stamps mappings  
  STAMPS_REQUIRED: {
    canonical: 'stamps_required',
    legacy: ['total_stamps', 'stampsRequired']
  },
  
  // Expiry mappings
  CARD_EXPIRY: {
    canonical: 'card_expiry_days', 
    legacy: ['expiry_days', 'cardExpiryDays']
  },
  
  // Business ID mappings
  BUSINESS_ID: {
    canonical: 'business_id',
    legacy: ['businessId']
  },
  
  // Color mappings
  CARD_COLOR: {
    canonical: 'card_color',
    legacy: ['cardColor']
  },
  
  // Icon mappings
  ICON_EMOJI: {
    canonical: 'icon_emoji',
    legacy: ['iconEmoji']
  }
} as const

/**
 * Validates that required fields are present in normalized data
 */
export function validateCardData(data: CanonicalCardData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.card_name?.trim()) {
    errors.push('Card name is required')
  }
  
  if (!data.business_id?.trim()) {
    errors.push('Business ID is required')
  }
  
  if (!data.stamps_required || data.stamps_required < 1) {
    errors.push('Stamps required must be at least 1')
  }
  
  if (data.card_expiry_days < 1) {
    errors.push('Card expiry days must be at least 1')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}