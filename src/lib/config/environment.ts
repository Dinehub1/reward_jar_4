/**
 * 🔧 ENVIRONMENT CONFIGURATION SYSTEM
 * 
 * Centralized environment variable validation and configuration
 * Supports dev/staging/production environments
 */

export interface EnvironmentConfig {
  // Core Configuration
  nodeEnv: 'development' | 'staging' | 'production'
  baseUrl: string
  
  // Supabase Configuration
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  
  // Wallet Configuration
  wallets: {
    apple: {
      configured: boolean
      teamIdentifier?: string
      passTypeIdentifier?: string
    }
    google: {
      configured: boolean
      serviceAccountEmail?: string
      privateKey?: string
      issuerId?: string
    }
    pwa: {
      configured: boolean
    }
  }
  
  // Optional Integrations
  monitoring: {
    sentry?: string
    posthog?: string
  }
}

/**
 * Validates and returns environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Core validation
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ]
  
  const missing = requiredVars.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Apple Wallet Configuration
  const appleConfigured = !!(
    process.env.APPLE_TEAM_IDENTIFIER && 
    process.env.APPLE_PASS_TYPE_IDENTIFIER
  )

  // Google Wallet Configuration  
  const googleConfigured = !!(
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY &&
    process.env.GOOGLE_WALLET_ISSUER_ID
  )

  // PWA is always available
  const pwaConfigured = !!process.env.NEXT_PUBLIC_BASE_URL

  return {
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
    
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    },
    
    wallets: {
      apple: {
        configured: appleConfigured,
        teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER
      },
      google: {
        configured: googleConfigured,
        serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_WALLET_PRIVATE_KEY,
        issuerId: process.env.GOOGLE_WALLET_ISSUER_ID
      },
      pwa: {
        configured: pwaConfigured
      }
    },
    
    monitoring: {
      sentry: process.env.SENTRY_DSN,
      posthog: process.env.NEXT_PUBLIC_POSTHOG_KEY
    }
  }
}

/**
 * Get wallet configuration status for admin panel
 */
export function getWalletStatus() {
  const config = getEnvironmentConfig()
  
  return {
    apple: {
      status: config.wallets.apple.configured ? 'configured' : 'missing_config',
      configured: config.wallets.apple.configured,
      ready: config.wallets.apple.configured
    },
    google: {
      status: config.wallets.google.configured ? 'configured' : 'missing_config', 
      configured: config.wallets.google.configured,
      ready: config.wallets.google.configured
    },
    pwa: {
      status: config.wallets.pwa.configured ? 'configured' : 'missing_config',
      configured: config.wallets.pwa.configured,
      ready: config.wallets.pwa.configured
    }
  }
}

/**
 * Runtime environment validation
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    getEnvironmentConfig()
  } catch (error: any) {
    errors.push(error.message)
  }
  
  // Additional runtime checks
  if (typeof window !== 'undefined') {
    // Client-side validation
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Environment-specific feature flags
 */
export function getFeatureFlags() {
  const config = getEnvironmentConfig()
  
  return {
    walletIntegrations: {
      apple: config.wallets.apple.configured,
      google: config.wallets.google.configured,
      pwa: true // Always available
    },
    monitoring: {
      sentry: !!config.monitoring.sentry,
      posthog: !!config.monitoring.posthog
    },
    development: {
      devTools: config.nodeEnv === 'development',
      debugMode: config.nodeEnv !== 'production'
    }
  }
}