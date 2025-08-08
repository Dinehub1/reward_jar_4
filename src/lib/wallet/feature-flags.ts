/**
 * Feature Flags for Wallet Chain System
 * 
 * Safe deployment controls for wallet functionality
 */

export interface WalletFeatureFlags {
  // Core wallet features
  walletGeneration: boolean
  appleWallet: boolean
  googleWallet: boolean
  pwaCards: boolean
  
  // Queue and processing
  queueProcessing: boolean
  backgroundGeneration: boolean
  retryFailedGeneration: boolean
  
  // Verification and testing
  walletVerification: boolean
  automaticVerification: boolean
  testMode: boolean
  
  // Admin features
  adminWalletProvisioning: boolean
  queueMonitoring: boolean
  manualGeneration: boolean
  
  // Performance and scaling
  parallelGeneration: boolean
  cachingEnabled: boolean
  s3Upload: boolean
  
  // Security features
  signatureValidation: boolean
  encryptedStorage: boolean
  accessLogging: boolean
}

/**
 * Default feature flag configuration
 */
const DEFAULT_FLAGS: WalletFeatureFlags = {
  // Core wallet features
  walletGeneration: true,
  appleWallet: true,
  googleWallet: true,
  pwaCards: true,
  
  // Queue and processing
  queueProcessing: true,
  backgroundGeneration: true,
  retryFailedGeneration: true,
  
  // Verification and testing
  walletVerification: true,
  automaticVerification: false, // Disabled by default for performance
  testMode: false,
  
  // Admin features
  adminWalletProvisioning: true,
  queueMonitoring: true,
  manualGeneration: true,
  
  // Performance and scaling
  parallelGeneration: false, // Start with sequential processing
  cachingEnabled: true,
  s3Upload: false, // Disabled until S3 is configured
  
  // Security features
  signatureValidation: true,
  encryptedStorage: false, // Disabled until encryption is configured
  accessLogging: true
}

/**
 * Environment-based feature flag overrides
 */
function getEnvironmentFlags(): Partial<WalletFeatureFlags> {
  const env = process.env
  
  return {
    // Global kill switches
    walletGeneration: env.DISABLE_WALLET_GENERATION !== 'true',
    queueProcessing: env.DISABLE_QUEUE_PROCESSING !== 'true',
    adminWalletProvisioning: env.DISABLE_WALLET_PROVISIONING !== 'true',
    
    // Platform-specific toggles
    appleWallet: env.DISABLE_APPLE_WALLET !== 'true' && !!env.APPLE_PASS_TYPE_ID,
    googleWallet: env.DISABLE_GOOGLE_WALLET !== 'true' && !!env.GOOGLE_SERVICE_ACCOUNT_JSON,
    pwaCards: env.DISABLE_PWA_CARDS !== 'true',
    
    // Feature-specific toggles
    automaticVerification: env.ENABLE_AUTOMATIC_VERIFICATION === 'true',
    testMode: env.WALLET_TEST_MODE === 'true',
    parallelGeneration: env.ENABLE_PARALLEL_GENERATION === 'true',
    s3Upload: env.ENABLE_S3_UPLOAD === 'true' && !!env.S3_TEST_BUCKET,
    encryptedStorage: env.ENABLE_ENCRYPTED_STORAGE === 'true',
    
    // Development flags
    walletVerification: env.NODE_ENV === 'development' || env.ENABLE_WALLET_VERIFICATION === 'true',
    signatureValidation: env.DISABLE_SIGNATURE_VALIDATION !== 'true'
  }
}

/**
 * Get current feature flags configuration
 */
export function getWalletFeatureFlags(): WalletFeatureFlags {
  const envFlags = getEnvironmentFlags()
  
  return {
    ...DEFAULT_FLAGS,
    ...envFlags
  }
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof WalletFeatureFlags): boolean {
  const flags = getWalletFeatureFlags()
  return flags[feature]
}

/**
 * Get feature flag status for API responses
 */
export function getFeatureFlagStatus() {
  const flags = getWalletFeatureFlags()
  
  return {
    wallet: {
      generation: flags.walletGeneration,
      platforms: {
        apple: flags.appleWallet,
        google: flags.googleWallet,
        pwa: flags.pwaCards
      },
      queue: flags.queueProcessing,
      verification: flags.walletVerification
    },
    admin: {
      provisioning: flags.adminWalletProvisioning,
      monitoring: flags.queueMonitoring,
      manual: flags.manualGeneration
    },
    environment: {
      testMode: flags.testMode,
      development: process.env.NODE_ENV === 'development'
    }
  }
}

/**
 * Validate required environment variables for enabled features
 */
export function validateEnvironmentForFeatures(): { valid: boolean; missing: string[]; warnings: string[] } {
  const flags = getWalletFeatureFlags()
  const missing: string[] = []
  const warnings: string[] = []
  
  // Check Apple Wallet requirements
  if (flags.appleWallet) {
    if (!process.env.APPLE_PASS_TYPE_ID) {
      missing.push('APPLE_PASS_TYPE_ID')
    }
    if (!process.env.APPLE_TEAM_ID) {
      missing.push('APPLE_TEAM_ID')
    }
    if (!process.env.APPLE_PASS_SIGNING_CERT) {
      warnings.push('APPLE_PASS_SIGNING_CERT not set - using test signatures')
    }
    if (!process.env.APPLE_PASS_SIGNING_KEY) {
      warnings.push('APPLE_PASS_SIGNING_KEY not set - using test signatures')
    }
  }
  
  // Check Google Wallet requirements
  if (flags.googleWallet) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      missing.push('GOOGLE_SERVICE_ACCOUNT_JSON')
    }
    if (!process.env.GOOGLE_WALLET_ISSUER_ID) {
      missing.push('GOOGLE_WALLET_ISSUER_ID')
    }
  }
  
  // Check S3 requirements
  if (flags.s3Upload) {
    if (!process.env.S3_TEST_BUCKET) {
      missing.push('S3_TEST_BUCKET')
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
      missing.push('AWS_ACCESS_KEY_ID')
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      missing.push('AWS_SECRET_ACCESS_KEY')
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * Feature flag middleware for route protection
 */
export function requireFeature(feature: keyof WalletFeatureFlags) {
  return (handler: Function) => {
    return (...args: any[]) => {
      if (!isFeatureEnabled(feature)) {
        throw new Error(`Feature '${feature}' is disabled`)
      }
      return handler(...args)
    }
  }
}

/**
 * Get deployment readiness status
 */
export function getDeploymentReadiness(): {
  ready: boolean
  blockers: string[]
  warnings: string[]
  recommendations: string[]
} {
  const flags = getWalletFeatureFlags()
  const envValidation = validateEnvironmentForFeatures()
  const blockers: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Critical blockers
  if (!envValidation.valid) {
    blockers.push(`Missing required environment variables: ${envValidation.missing.join(', ')}`)
  }
  
  if (flags.walletGeneration && !flags.queueProcessing) {
    blockers.push('Wallet generation is enabled but queue processing is disabled')
  }
  
  // Warnings
  if (flags.testMode) {
    warnings.push('Running in test mode - not suitable for production')
  }
  
  if (!flags.automaticVerification) {
    warnings.push('Automatic verification is disabled - manual testing required')
  }
  
  if (!flags.signatureValidation) {
    warnings.push('Signature validation is disabled - security risk')
  }
  
  // Recommendations
  if (!flags.parallelGeneration) {
    recommendations.push('Enable parallel generation for better performance')
  }
  
  if (!flags.s3Upload) {
    recommendations.push('Configure S3 upload for production file storage')
  }
  
  if (!flags.encryptedStorage) {
    recommendations.push('Enable encrypted storage for sensitive data')
  }
  
  if (envValidation.warnings.length > 0) {
    recommendations.push(`Configure production certificates: ${envValidation.warnings.join(', ')}`)
  }
  
  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    recommendations
  }
}

/**
 * Environment variable documentation
 */
export const ENVIRONMENT_DOCS = {
  required: {
    // Apple Wallet
    APPLE_PASS_TYPE_ID: 'Apple Pass Type ID (e.g., pass.com.yourcompany.loyalty)',
    APPLE_TEAM_ID: 'Apple Developer Team ID',
    
    // Google Wallet
    GOOGLE_SERVICE_ACCOUNT_JSON: 'Google Service Account JSON (as string)',
    GOOGLE_WALLET_ISSUER_ID: 'Google Wallet Issuer ID'
  },
  
  optional: {
    // Apple Wallet (production)
    APPLE_PASS_SIGNING_CERT: 'Apple Pass signing certificate (base64)',
    APPLE_PASS_SIGNING_KEY: 'Apple Pass signing private key',
    
    // Storage
    S3_TEST_BUCKET: 'S3 bucket for pass file storage',
    AWS_ACCESS_KEY_ID: 'AWS access key for S3',
    AWS_SECRET_ACCESS_KEY: 'AWS secret key for S3',
    
    // Feature flags
    DISABLE_WALLET_GENERATION: 'Set to "true" to disable wallet generation',
    DISABLE_WALLET_PROVISIONING: 'Set to "true" to disable admin provisioning',
    DISABLE_APPLE_WALLET: 'Set to "true" to disable Apple Wallet',
    DISABLE_GOOGLE_WALLET: 'Set to "true" to disable Google Wallet',
    DISABLE_PWA_CARDS: 'Set to "true" to disable PWA cards',
    ENABLE_AUTOMATIC_VERIFICATION: 'Set to "true" to enable automatic verification',
    ENABLE_PARALLEL_GENERATION: 'Set to "true" to enable parallel processing',
    WALLET_TEST_MODE: 'Set to "true" for test mode'
  }
}