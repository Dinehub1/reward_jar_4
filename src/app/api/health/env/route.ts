import { NextResponse } from 'next/server'

// Winston logger for error tracking
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'wallet-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'wallet-combined.log' })
  ]
})

interface EnvironmentCheck {
  status: string
  variables: Record<string, unknown>
}

interface GoogleWalletCheck extends EnvironmentCheck {
  configured: boolean
  privateKeyValid: boolean
  serviceAccountValid: boolean
  classIdValid: boolean
}

interface AppleWalletCheck extends EnvironmentCheck {
  configured: boolean
  certificatesValid: boolean
}

interface PWAWalletCheck extends EnvironmentCheck {
  available: boolean
}

interface EnvironmentValidationResult {
  status: string
  coreApplication: EnvironmentCheck
  googleWallet: GoogleWalletCheck
  appleWallet: AppleWalletCheck
  pwaWallet: PWAWalletCheck
  securityAnalytics: EnvironmentCheck
  summary: {
    totalVariables: number
    configuredVariables: number
    completionPercentage: number
    criticalIssues: string[]
    recommendations: string[]
  }
}

// Validation helper functions
function validatePEMFormat(key: string, type: 'PRIVATE' | 'CERTIFICATE'): boolean {
  if (!key || typeof key !== 'string') return false
  
  const beginMarker = `-----BEGIN ${type} KEY-----`
  const endMarker = `-----END ${type} KEY-----`
  
  return key.includes(beginMarker) && 
         key.includes(endMarker) && 
         key.includes('\n')
}

function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateGoogleClassId(classId: string): boolean {
  if (!classId || typeof classId !== 'string') return false
  // Format: issuer.category.identifier (e.g., issuer.loyalty.rewardjar)
  const classIdRegex = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
  return classIdRegex.test(classId)
}

function validateBase64Certificate(cert: string): boolean {
  if (!cert || typeof cert !== 'string') return false
  try {
    // Basic base64 validation
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(cert) && cert.length > 100 // Reasonable minimum length
  } catch {
    return false
  }
}

export async function GET() {
  try {
    console.log('🔍 Starting environment validation...')
    
    // Core Application Variables
    const coreVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      BASE_URL: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    }

    // Google Wallet Variables with enhanced validation
    const googleWalletVars = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      GOOGLE_CLASS_ID: process.env.GOOGLE_CLASS_ID,
    }

    // Apple Wallet Variables
    const appleWalletVars = {
      APPLE_CERT_BASE64: process.env.APPLE_CERT_BASE64,
      APPLE_KEY_BASE64: process.env.APPLE_KEY_BASE64,
      APPLE_WWDR_BASE64: process.env.APPLE_WWDR_BASE64,
      APPLE_CERT_PASSWORD: process.env.APPLE_CERT_PASSWORD,
      APPLE_TEAM_IDENTIFIER: process.env.APPLE_TEAM_IDENTIFIER,
      APPLE_PASS_TYPE_IDENTIFIER: process.env.APPLE_PASS_TYPE_IDENTIFIER,
    }

    // Security & Analytics Variables
    const securityVars = {
      API_KEY: process.env.API_KEY,
      DEV_SEED_API_KEY: process.env.DEV_SEED_API_KEY,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    }

    let criticalIssues: string[] = []
    let recommendations: string[] = []

    // Validate Core Application
    const coreConfigured = Object.values(coreVars).filter(Boolean).length
    const coreStatus = coreConfigured >= 4 ? 'operational' : 'needs_configuration'
    
    if (coreConfigured < 4) {
      criticalIssues.push('Core application variables incomplete')
    }

    // Enhanced Google Wallet Validation
    let googleWalletConfigured = 0
    let privateKeyValid = false
    let serviceAccountValid = false
    let classIdValid = false

    if (googleWalletVars.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      googleWalletConfigured++
      serviceAccountValid = validateEmailFormat(googleWalletVars.GOOGLE_SERVICE_ACCOUNT_EMAIL)
      if (!serviceAccountValid) {
        criticalIssues.push('GOOGLE_SERVICE_ACCOUNT_EMAIL has invalid email format')
      }
    }

    if (googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      googleWalletConfigured++
      privateKeyValid = validatePEMFormat(googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, 'PRIVATE')
      if (!privateKeyValid) {
        criticalIssues.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY has invalid PEM format')
        logger.error('Google Wallet private key validation failed', {
          hasBeginMarker: googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----'),
          hasEndMarker: googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.includes('-----END PRIVATE KEY-----'),
          hasNewlines: googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.includes('\n'),
          length: googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.length
        })
      }
    }

    if (googleWalletVars.GOOGLE_CLASS_ID) {
      googleWalletConfigured++
      classIdValid = validateGoogleClassId(googleWalletVars.GOOGLE_CLASS_ID)
      if (!classIdValid) {
        criticalIssues.push('GOOGLE_CLASS_ID has invalid format (should be issuer.category.identifier)')
      }
    }

    const googleWalletStatus = googleWalletConfigured === 3 && privateKeyValid && serviceAccountValid && classIdValid
      ? 'ready_for_production'
      : googleWalletConfigured > 0
      ? 'needs_configuration'
      : 'not_configured'

    // Validate Apple Wallet
    const appleConfigured = Object.values(appleWalletVars).filter(Boolean).length
    const appleCertificatesValid = validateBase64Certificate(appleWalletVars.APPLE_CERT_BASE64 || '') &&
                                  validateBase64Certificate(appleWalletVars.APPLE_KEY_BASE64 || '') &&
                                  validateBase64Certificate(appleWalletVars.APPLE_WWDR_BASE64 || '')
    
    const appleWalletStatus = appleConfigured === 6 && appleCertificatesValid
      ? 'ready_for_production'
      : appleConfigured > 0
      ? 'needs_certificates'
      : 'not_configured'

    if (appleConfigured > 0 && !appleCertificatesValid) {
      criticalIssues.push('Apple Wallet certificates have invalid Base64 format')
    }

    // Validate Security & Analytics
    const securityConfigured = Object.values(securityVars).filter(Boolean).length
    const securityStatus = securityConfigured > 0 ? 'partial' : 'optional'

    // Calculate overall metrics
    const totalVariables = 17 // As per documentation
    const configuredVariables = coreConfigured + googleWalletConfigured + appleConfigured + securityConfigured
    const completionPercentage = Math.round((configuredVariables / totalVariables) * 100)

    // Generate recommendations
    if (googleWalletStatus === 'needs_configuration') {
      recommendations.push('Complete Google Wallet configuration for production deployment')
    }
    if (appleWalletStatus === 'needs_certificates') {
      recommendations.push('Upload valid Apple Wallet certificates from Apple Developer Portal')
    }
    if (securityConfigured === 0) {
      recommendations.push('Consider adding API_KEY for enhanced security')
    }
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      recommendations.push('Set NEXT_PUBLIC_BASE_URL for production deployment')
    }

    const result: EnvironmentValidationResult = {
      status: criticalIssues.length === 0 ? 'healthy' : 'degraded',
      coreApplication: {
        status: coreStatus,
        variables: {
          configured: `${coreConfigured}/6`,
          NEXT_PUBLIC_SUPABASE_URL: coreVars.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: coreVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
          SUPABASE_SERVICE_ROLE_KEY: coreVars.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
          BASE_URL: coreVars.BASE_URL ? 'configured' : 'missing',
          NEXT_PUBLIC_BASE_URL: coreVars.NEXT_PUBLIC_BASE_URL ? 'configured' : 'missing',
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: coreVars.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
        }
      },
      googleWallet: {
        status: googleWalletStatus,
        configured: googleWalletConfigured === 3,
        privateKeyValid,
        serviceAccountValid,
        classIdValid,
        variables: {
          configured: `${googleWalletConfigured}/3`,
          GOOGLE_SERVICE_ACCOUNT_EMAIL: googleWalletVars.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 
            (serviceAccountValid ? 'valid' : 'invalid_format') : 'missing',
          GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: googleWalletVars.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 
            (privateKeyValid ? 'valid_pem_format' : 'invalid_pem_format') : 'missing',
          GOOGLE_CLASS_ID: googleWalletVars.GOOGLE_CLASS_ID ? 
            (classIdValid ? 'valid' : 'invalid_format') : 'missing',
        }
      },
      appleWallet: {
        status: appleWalletStatus,
        configured: appleConfigured === 6,
        certificatesValid: appleCertificatesValid,
        variables: {
          configured: `${appleConfigured}/6`,
          certificates: appleCertificatesValid ? 'valid' : 'invalid_or_missing'
        }
      },
      pwaWallet: {
        status: 'always_available',
        available: true,
        variables: {
          support: 'native',
          offline_capable: true
        }
      },
      securityAnalytics: {
        status: securityStatus,
        variables: {
          configured: `${securityConfigured}/4`,
          API_KEY: securityVars.API_KEY ? 'configured' : 'optional',
          DEV_SEED_API_KEY: securityVars.DEV_SEED_API_KEY ? 'configured' : 'optional',
          analytics: securityVars.NEXT_PUBLIC_POSTHOG_KEY ? 'configured' : 'optional'
        }
      },
      summary: {
        totalVariables,
        configuredVariables,
        completionPercentage,
        criticalIssues,
        recommendations
      }
    }

    console.log(`✅ Environment validation completed: ${completionPercentage}% (${configuredVariables}/${totalVariables})`)

    // Return 200 for successful validation, even if some variables are missing
    // Return 503 only for critical system failures
    const statusCode = result.status === 'healthy' ? 200 : 
                      criticalIssues.length > 0 ? 200 : // Still return 200 with degraded status
                      200

    return NextResponse.json(result, { status: statusCode })

  } catch (error) {
    console.error('❌ Critical error in environment validation:', error)
    logger.error('Critical error in environment validation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Only return 500 for actual server errors, not configuration issues
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error during environment validation',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 