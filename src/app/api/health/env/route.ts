import { NextResponse } from 'next/server'

interface EnvironmentCheck {
  status: string
  variables: Record<string, unknown>
}

interface EnvironmentValidationResult {
  status: string
  coreApplication: EnvironmentCheck
  googleWallet: EnvironmentCheck & {
    configured: boolean
    privateKeyValid: boolean
    serviceAccountValid: boolean
  }
  appleWallet: EnvironmentCheck & {
    configured: boolean
    certificatesValid: boolean
  }
  pwaWallet: EnvironmentCheck & {
    available: boolean
  }
  securityAnalytics: EnvironmentCheck
  summary: {
    totalVariables: number
    configuredVariables: number
    completionPercentage: number
    criticalIssues: string[]
    recommendations: string[]
  }
}

export async function GET() {
  try {
    // Validate core environment variables
    const coreVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      BASE_URL: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    }

    // Validate Google Wallet specific variables with enhanced private key validation
    const googleWalletVars = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      GOOGLE_CLASS_ID: process.env.GOOGLE_CLASS_ID,
    }

    // Enhanced Google Wallet private key validation
    const validateGooglePrivateKey = (): { valid: boolean; details: string; errors: string[] } => {
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
      const errors: string[] = []
      
      if (!privateKey) {
        errors.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not set')
        return { valid: false, details: 'Missing', errors }
      }

      // Check if it's properly formatted as PEM
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        errors.push('Private key must start with "-----BEGIN PRIVATE KEY-----"')
      }
      
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        errors.push('Private key must end with "-----END PRIVATE KEY-----"')
      }

      // Check for proper newlines (should be actual newlines, not escaped)
      if (privateKey.includes('\\n') && !privateKey.includes('\n')) {
        errors.push('Private key contains escaped newlines (\\n) instead of actual newlines')
      }

      // Check minimum length (RSA 2048-bit private keys are typically 1600+ characters)
      if (privateKey.length < 1000) {
        errors.push('Private key appears too short (should be 1600+ characters for RSA 2048-bit)')
      }

      // Try to validate the base64 content between the PEM markers
      try {
        const pemContent = privateKey
          .replace('-----BEGIN PRIVATE KEY-----', '')
          .replace('-----END PRIVATE KEY-----', '')
          .replace(/\s/g, '')
        
        // Basic base64 validation
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(pemContent)) {
          errors.push('Private key contains invalid base64 characters')
        }
      } catch (error) {
        errors.push(`Private key format validation error: ${(error as Error).message}`)
      }

      const isValid = errors.length === 0
      const details = isValid ? 'Valid PEM format' : `Invalid: ${errors.join(', ')}`
      
      return { valid: isValid, details, errors }
    }

    const privateKeyValidation = validateGooglePrivateKey()

    // Validate Apple Wallet variables
    const appleWalletVars = {
      APPLE_CERT_BASE64: process.env.APPLE_CERT_BASE64,
      APPLE_KEY_BASE64: process.env.APPLE_KEY_BASE64,
      APPLE_WWDR_BASE64: process.env.APPLE_WWDR_BASE64,
      APPLE_CERT_PASSWORD: process.env.APPLE_CERT_PASSWORD,
      APPLE_TEAM_IDENTIFIER: process.env.APPLE_TEAM_IDENTIFIER,
      APPLE_PASS_TYPE_IDENTIFIER: process.env.APPLE_PASS_TYPE_IDENTIFIER,
    }

    // Validate security & analytics variables
    const securityAnalyticsVars = {
      API_KEY: process.env.API_KEY,
      DEV_SEED_API_KEY: process.env.DEV_SEED_API_KEY,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    }

    // Count configured variables for each category
    const countConfigured = (vars: Record<string, unknown>) => {
      return Object.values(vars).filter(Boolean).length
    }

    const coreConfigured = countConfigured(coreVars)
    const googleConfigured = countConfigured(googleWalletVars)
    const appleConfigured = countConfigured(appleWalletVars)
    const securityConfigured = countConfigured(securityAnalyticsVars)

    // Calculate totals
    const totalVariables = Object.keys({
      ...coreVars,
      ...googleWalletVars,
      ...appleWalletVars,
      ...securityAnalyticsVars
    }).length

    const configuredVariables = coreConfigured + googleConfigured + appleConfigured + securityConfigured
    const completionPercentage = Math.round((configuredVariables / totalVariables) * 100)

    // Generate critical issues and recommendations
    const criticalIssues: string[] = []
    const recommendations: string[] = []

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      criticalIssues.push('Supabase URL is required for database connectivity')
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      criticalIssues.push('Supabase Service Role Key is required for server-side operations')
    }

    if (!privateKeyValidation.valid) {
      criticalIssues.push('Google Wallet private key is invalid or malformed')
      recommendations.push(...privateKeyValidation.errors.map(error => `Fix Google private key: ${error}`))
    }

    if (googleConfigured < 3) {
      recommendations.push('Complete Google Wallet configuration for full functionality')
    }

    if (appleConfigured === 0) {
      recommendations.push('Configure Apple Wallet certificates for iOS integration')
    }

    // Build comprehensive response
    const result: EnvironmentValidationResult = {
      status: criticalIssues.length === 0 ? 'healthy' : 'degraded',
      
      coreApplication: {
        status: coreConfigured === Object.keys(coreVars).length ? 'configured' : 'partial',
        variables: Object.fromEntries(
          Object.entries(coreVars).map(([key, value]) => [
            key, 
            value ? (key.includes('KEY') ? 'configured' : String(value).substring(0, 20) + '...') : 'not_set'
          ])
        )
      },

      googleWallet: {
        status: googleConfigured === 3 && privateKeyValidation.valid ? 'configured' : 'partial',
        configured: googleConfigured === 3,
        privateKeyValid: privateKeyValidation.valid,
        serviceAccountValid: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.GOOGLE_CLASS_ID,
        variables: {
          GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'not_set',
          GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKeyValidation.details,
          GOOGLE_CLASS_ID: process.env.GOOGLE_CLASS_ID || 'not_set'
        }
      },

      appleWallet: {
        status: appleConfigured === Object.keys(appleWalletVars).length ? 'configured' : 'partial',
        configured: appleConfigured > 0,
        certificatesValid: appleConfigured >= 3, // At least cert, key, and WWDR
        variables: Object.fromEntries(
          Object.entries(appleWalletVars).map(([key, value]) => [
            key, 
            value ? (key.includes('BASE64') ? 'configured' : String(value)) : 'not_set'
          ])
        )
      },

      pwaWallet: {
        status: 'configured',
        available: true,
        variables: {
          status: 'Always available - no configuration required'
        }
      },

      securityAnalytics: {
        status: securityConfigured > 0 ? 'configured' : 'not_configured',
        variables: Object.fromEntries(
          Object.entries(securityAnalyticsVars).map(([key, value]) => [
            key, 
            value ? 'configured' : 'not_set'
          ])
        )
      },

      summary: {
        totalVariables,
        configuredVariables,
        completionPercentage,
        criticalIssues,
        recommendations
      }
    }

    return NextResponse.json(result, {
      status: criticalIssues.length === 0 ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Environment validation error:', error)
    
    return NextResponse.json({
      status: 'error',
      error: 'Failed to validate environment variables',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  }
} 