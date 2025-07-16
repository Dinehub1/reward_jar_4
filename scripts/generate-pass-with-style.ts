import crypto from 'crypto'

interface PassOptions {
  customerCardId: string
  stamps: number
  totalStamps: number
  businessName: string
  cardName: string
  reward: string
  customerName: string
  backgroundColor?: string
  foregroundColor?: string
  labelColor?: string
  logoText?: string
  organizationName?: string
}

interface PassField {
  key: string
  label: string
  value: string
  textAlignment?: string
}

export function generateStyledPass(options: PassOptions): Record<string, unknown> {
  const {
    customerCardId,
    stamps,
    totalStamps,
    businessName,
    cardName,
    reward,
    customerName,
    backgroundColor = 'rgb(16, 185, 129)', // green-500
    foregroundColor = 'rgb(255, 255, 255)',
    labelColor = 'rgb(255, 255, 255)',
    logoText = 'RewardJar',
    organizationName = 'RewardJar'
  } = options

  // Calculate progress
  const progress = Math.min((stamps / totalStamps) * 100, 100)
  const isCompleted = stamps >= totalStamps
  const stampsRemaining = Math.max(totalStamps - stamps, 0)

  // Generate pass data with enhanced styling
  const passData = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.rewardjar.rewards',
    serialNumber: customerCardId,
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER || '39CDB598RF',
    organizationName,
    description: `${cardName} - ${businessName}`,
    logoText,
    backgroundColor,
    foregroundColor,
    labelColor,
    
    storeCard: {
      // Header field - card name
      headerFields: [
        {
          key: 'card_name',
          label: 'Loyalty Card',
          value: cardName,
          textAlignment: 'PKTextAlignmentCenter'
        }
      ],
      
      // Primary field - main stamp count (large, prominent)
      primaryFields: [
        {
          key: 'stamps',
          label: 'Stamps Collected',
          value: `${stamps}/${totalStamps}`,
          textAlignment: 'PKTextAlignmentCenter'
        }
      ],
      
      // Secondary fields - progress and remaining (medium size)
      secondaryFields: [
        {
          key: 'progress',
          label: 'Progress',
          value: `${Math.round(progress)}%`,
          textAlignment: 'PKTextAlignmentLeft'
        },
        {
          key: 'remaining',
          label: isCompleted ? 'Status' : 'Remaining',
          value: isCompleted ? 'Completed!' : `${stampsRemaining} stamps`,
          textAlignment: 'PKTextAlignmentRight'
        }
      ],
      
      // Auxiliary fields - business and reward info (smaller)
      auxiliaryFields: [
        {
          key: 'business',
          label: 'Business',
          value: businessName,
          textAlignment: 'PKTextAlignmentLeft'
        },
        {
          key: 'reward',
          label: 'Reward',
          value: reward,
          textAlignment: 'PKTextAlignmentLeft'
        }
      ],
      
      // Back fields - detailed information
      backFields: [
        {
          key: 'description',
          label: 'About This Card',
          value: `Collect ${totalStamps} stamps to earn: ${reward}`
        },
        {
          key: 'customer_info',
          label: 'Customer',
          value: `This card belongs to ${customerName}`
        },
        {
          key: 'business_info',
          label: businessName,
          value: 'Visit us to collect stamps and earn rewards!'
        },
        {
          key: 'instructions',
          label: 'How to Use',
          value: 'Show this pass to collect stamps at participating locations. Your pass will automatically update when new stamps are added.'
        },
        {
          key: 'contact',
          label: 'Questions?',
          value: 'Contact the business directly or visit rewardjar.com for support.'
        }
      ]
    },

    // QR Code with customer card ID
    barcodes: [
      {
        message: customerCardId,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `Card ID: ${customerCardId}`
      }
    ],
    
    // Legacy barcode for iOS 8 compatibility
    barcode: {
      message: customerCardId,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: `Card ID: ${customerCardId}`
    },

    // Location and relevance
    locations: [],
    maxDistance: 1000,
    relevantDate: new Date().toISOString(),
    
    // Visual enhancements
    suppressStripShine: false,
    sharingProhibited: false,
    
    // Web service for updates
    webServiceURL: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/updates`,
    authenticationToken: customerCardId,
    
    // Additional metadata
    userInfo: {
      customerCardId,
      businessName,
      cardName,
      stamps,
      totalStamps,
      isCompleted
    }
  }

  return passData
}

// Color presets for different business types
export const colorPresets = {
  coffee: {
    backgroundColor: 'rgb(139, 69, 19)', // saddle brown
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)'
  },
  restaurant: {
    backgroundColor: 'rgb(220, 38, 38)', // red-600
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)'
  },
  retail: {
    backgroundColor: 'rgb(79, 70, 229)', // indigo-600
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)'
  },
  beauty: {
    backgroundColor: 'rgb(219, 39, 119)', // pink-600
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)'
  },
  fitness: {
    backgroundColor: 'rgb(34, 197, 94)', // green-500
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)'
  },
  default: {
    backgroundColor: 'rgb(16, 185, 129)', // emerald-500
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(255, 255, 255)'
  }
}

// Helper function to generate pass with color preset
export function generateStyledPassWithPreset(
  options: PassOptions, 
  preset: keyof typeof colorPresets = 'default'
): Record<string, unknown> {
  const colors = colorPresets[preset]
  return generateStyledPass({
    ...options,
    ...colors
  })
}

// Validation function for pass structure
export function validatePassStructure(passData: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Required fields
  const requiredFields = [
    'formatVersion',
    'passTypeIdentifier', 
    'serialNumber',
    'teamIdentifier',
    'organizationName',
    'description'
  ]
  
  for (const field of requiredFields) {
    if (!passData[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  // Validate storeCard structure
  const storeCard = passData.storeCard as Record<string, unknown>
  if (!storeCard) {
    errors.push('Missing storeCard object')
  } else {
    const requiredArrays = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields']
    for (const array of requiredArrays) {
      if (!Array.isArray(storeCard[array])) {
        errors.push(`storeCard.${array} must be an array`)
      }
    }
  }
  
  // Validate barcodes
  const barcodes = passData.barcodes as unknown[]
  if (!Array.isArray(barcodes) || barcodes.length === 0) {
    errors.push('Must include at least one barcode')
  }
  
  return errors
}

// Generate SHA1 hash for manifest
export function sha1Hash(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('hex')
}

// Example usage:
/*
const passOptions: PassOptions = {
  customerCardId: 'test-card-123',
  stamps: 6,
  totalStamps: 10,
  businessName: 'Bella Buono Coffee',
  cardName: 'Coffee Lover Rewards',
  reward: 'Free premium coffee of your choice',
  customerName: 'John Doe'
}

const passData = generateStyledPassWithPreset(passOptions, 'coffee')
console.log(JSON.stringify(passData, null, 2))
*/ 