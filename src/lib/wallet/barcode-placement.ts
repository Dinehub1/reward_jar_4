/**
 * Platform-specific barcode placement logic (Phase 2)
 * 
 * Automatically determines optimal barcode placement based on:
 * - Platform (Apple Wallet, Google Wallet, PWA)
 * - Card type (stamp vs membership)
 * - Content density
 * - Platform design guidelines
 */

export type BarcodeType = 'PDF417' | 'QR_CODE' | 'AZTEC' | 'CODE128'
export type Platform = 'apple' | 'google' | 'pwa'
export type CardType = 'stamp' | 'membership'

export interface BarcodeConfig {
  type: BarcodeType
  placement: 'front' | 'back'
  position: 'header' | 'primary' | 'secondary' | 'auxiliary' | 'footer'
  size: 'small' | 'medium' | 'large'
  alignment: 'left' | 'center' | 'right'
}

// Platform-specific barcode capabilities and preferences
const PLATFORM_BARCODE_SUPPORT = {
  apple: {
    supportedTypes: ['PDF417', 'QR_CODE', 'AZTEC', 'CODE128'] as BarcodeType[],
    preferredType: 'PDF417' as BarcodeType,
    maxBarcodes: 1,
    placement: {
      primary: 'back', // Apple prefers barcodes on back
      fallback: 'front'
    },
    positions: ['header', 'primary', 'secondary', 'auxiliary'] as const
  },
  google: {
    supportedTypes: ['QR_CODE', 'PDF417', 'AZTEC', 'CODE128'] as BarcodeType[],
    preferredType: 'QR_CODE' as BarcodeType,
    maxBarcodes: 1,
    placement: {
      primary: 'front', // Google prefers barcodes prominently on front
      fallback: 'back'
    },
    positions: ['primary', 'secondary', 'auxiliary'] as const
  },
  pwa: {
    supportedTypes: ['QR_CODE', 'PDF417'] as BarcodeType[],
    preferredType: 'QR_CODE' as BarcodeType,
    maxBarcodes: 1,
    placement: {
      primary: 'front', // PWA shows prominently for easy scanning
      fallback: 'front'
    },
    positions: ['primary', 'footer'] as const
  }
} as const

// Card type preferences affect barcode placement
const CARD_TYPE_PREFERENCES = {
  stamp: {
    priority: 'accessibility', // Easy scanning for stamp collection
    preferredSizes: ['medium', 'large'] as const,
    preferredPlacements: ['front'] as const
  },
  membership: {
    priority: 'elegance', // More discrete, professional appearance
    preferredSizes: ['small', 'medium'] as const,
    preferredPlacements: ['back', 'front'] as const
  }
} as const

/**
 * Automatically determine optimal barcode configuration
 */
export function getOptimalBarcodeConfig(
  platform: Platform,
  cardType: CardType,
  contentDensity: 'low' | 'medium' | 'high' = 'medium'
): BarcodeConfig {
  const platformConfig = PLATFORM_BARCODE_SUPPORT[platform]
  const cardPrefs = CARD_TYPE_PREFERENCES[cardType]
  
  // Determine barcode type
  const barcodeType = platformConfig.preferredType
  
  // Determine placement (front vs back)
  const placement = determinePlacement(platform, cardType, contentDensity)
  
  // Determine position within the placement
  const position = determinePosition(platform, cardType, placement, contentDensity)
  
  // Determine size
  const size = determineSize(platform, cardType, contentDensity)
  
  // Determine alignment
  const alignment = determineAlignment(platform, cardType, position)
  
  return {
    type: barcodeType,
    placement,
    position,
    size,
    alignment
  }
}

function determinePlacement(
  platform: Platform,
  cardType: CardType,
  contentDensity: 'low' | 'medium' | 'high'
): 'front' | 'back' {
  const platformConfig = PLATFORM_BARCODE_SUPPORT[platform]
  const cardPrefs = CARD_TYPE_PREFERENCES[cardType]
  
  // High density content pushes barcodes to back
  if (contentDensity === 'high') {
    return 'back'
  }
  
  // Platform-specific logic
  switch (platform) {
    case 'apple':
      // Apple generally prefers back placement for cleaner front design
      return cardType === 'stamp' && contentDensity === 'low' ? 'front' : 'back'
      
    case 'google':
      // Google prefers front placement for immediate visibility
      return 'front'
      
    case 'pwa':
      // PWA always shows on front for easy scanning
      return 'front'
      
    default:
      return platformConfig.placement.primary
  }
}

function determinePosition(
  platform: Platform,
  cardType: CardType,
  placement: 'front' | 'back',
  contentDensity: 'low' | 'medium' | 'high'
): BarcodeConfig['position'] {
  const platformConfig = PLATFORM_BARCODE_SUPPORT[platform]
  
  // Platform-specific position logic
  switch (platform) {
    case 'apple':
      if (placement === 'back') {
        return contentDensity === 'high' ? 'footer' : 'primary'
      } else {
        return contentDensity === 'low' ? 'auxiliary' : 'secondary'
      }
      
    case 'google':
      if (placement === 'front') {
        return cardType === 'stamp' ? 'primary' : 'secondary'
      } else {
        return 'primary'
      }
      
    case 'pwa':
      // PWA always uses footer position for consistent scanning area
      return 'footer'
      
    default:
      return 'primary'
  }
}

function determineSize(
  platform: Platform,
  cardType: CardType,
  contentDensity: 'low' | 'medium' | 'high'
): BarcodeConfig['size'] {
  // Size based on content density and platform
  if (contentDensity === 'high') {
    return 'small'
  }
  
  if (platform === 'pwa') {
    return 'large' // PWA can afford larger barcodes
  }
  
  if (cardType === 'stamp') {
    return 'medium' // Balance between visibility and space
  }
  
  return 'small' // Conservative default for membership cards
}

function determineAlignment(
  platform: Platform,
  cardType: CardType,
  position: BarcodeConfig['position']
): BarcodeConfig['alignment'] {
  // Alignment based on position and platform guidelines
  switch (position) {
    case 'header':
      return 'center'
    case 'primary':
      return platform === 'apple' ? 'center' : 'center'
    case 'secondary':
      return 'right'
    case 'auxiliary':
      return 'left'
    case 'footer':
      return 'center'
    default:
      return 'center'
  }
}

/**
 * Get barcode placement recommendations for all platforms
 */
export function getAllPlatformBarcodeConfigs(
  cardType: CardType,
  contentDensity: 'low' | 'medium' | 'high' = 'medium'
): Record<Platform, BarcodeConfig> {
  return {
    apple: getOptimalBarcodeConfig('apple', cardType, contentDensity),
    google: getOptimalBarcodeConfig('google', cardType, contentDensity),
    pwa: getOptimalBarcodeConfig('pwa', cardType, contentDensity)
  }
}

/**
 * Validate barcode configuration against platform capabilities
 */
export function validateBarcodeConfig(
  platform: Platform,
  config: BarcodeConfig
): { valid: boolean; issues: string[] } {
  const platformConfig = PLATFORM_BARCODE_SUPPORT[platform]
  const issues: string[] = []
  
  // Check supported barcode types
  if (!platformConfig.supportedTypes.includes(config.type)) {
    issues.push(`${config.type} not supported on ${platform}`)
  }
  
  // Check position availability
  if (!platformConfig.positions.includes(config.position as any)) {
    issues.push(`Position ${config.position} not available on ${platform}`)
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Generate barcode style configuration for rendering
 */
export function getBarcodeStyles(
  config: BarcodeConfig,
  platform: Platform
): {
  width: string
  height: string
  marginTop: string
  marginBottom: string
  borderRadius: string
} {
  const sizeMap = {
    small: { width: '120px', height: '30px' },
    medium: { width: '200px', height: '50px' },
    large: { width: '280px', height: '70px' }
  }
  
  const platformStyles = {
    apple: {
      borderRadius: '8px',
      marginTop: '12px',
      marginBottom: '12px'
    },
    google: {
      borderRadius: '4px',
      marginTop: '16px',
      marginBottom: '16px'
    },
    pwa: {
      borderRadius: '12px',
      marginTop: '20px',
      marginBottom: '20px'
    }
  }
  
  const baseSize = sizeMap[config.size]
  const platformStyle = platformStyles[platform]
  
  return {
    ...baseSize,
    ...platformStyle
  }
}