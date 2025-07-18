import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Validate core environment variables
    const coreVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      BASE_URL: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL,
    }

    // Validate Google Wallet specific variables
    const googleWalletVars = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      GOOGLE_CLASS_ID: process.env.GOOGLE_CLASS_ID,
    }

    // Validate Google Wallet private key format
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    let privateKeyValid = false
    let privateKeyError = ''

    if (!privateKey) {
      privateKeyError = 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing'
    } else {
      // Check for proper PEM format
      const pemStart = '-----BEGIN PRIVATE KEY-----'
      const pemEnd = '-----END PRIVATE KEY-----'
      
      if (!privateKey.includes(pemStart) || !privateKey.includes(pemEnd)) {
        privateKeyError = 'Private key is not in proper PEM format'
      } else {
        // Check for proper newline escaping
        const hasProperNewlines = privateKey.includes('\\n') || privateKey.includes('\n')
        if (!hasProperNewlines) {
          privateKeyError = 'Private key missing proper newline characters'
        } else {
          privateKeyValid = true
        }
      }
    }

    // Check core variables status
    const coreStatus = Object.entries(coreVars).reduce((acc, [key, value]) => {
      acc[key] = {
        configured: !!value,
        valid: !!value,
        message: value ? 'Configured' : 'Missing'
      }
      return acc
    }, {} as Record<string, any>)

    // Check Google Wallet variables status
    const googleWalletStatus = Object.entries(googleWalletVars).reduce((acc, [key, value]) => {
      if (key === 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') {
        acc[key] = {
          configured: !!value,
          valid: privateKeyValid,
          message: privateKeyValid ? 'Valid PEM format with proper newlines' : privateKeyError
        }
      } else {
        acc[key] = {
          configured: !!value,
          valid: !!value,
          message: value ? 'Configured' : 'Missing'
        }
      }
      return acc
    }, {} as Record<string, any>)

    // Calculate overall status
    const allCoreValid = Object.values(coreStatus).every(status => status.valid)
    const allGoogleWalletValid = Object.values(googleWalletStatus).every(status => status.valid)

    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      status: allCoreValid && allGoogleWalletValid ? 'healthy' : 'degraded',
      core: {
        status: allCoreValid ? 'healthy' : 'error',
        variables: coreStatus
      },
      googleWallet: {
        status: allGoogleWalletValid ? 'healthy' : 'error',
        variables: googleWalletStatus,
        privateKeyValid,
        jwtSigningReady: privateKeyValid && !!googleWalletVars.GOOGLE_SERVICE_ACCOUNT_EMAIL
      },
      validation: {
        privateKeyFormat: privateKeyValid ? 'valid' : 'invalid',
        privateKeyError: privateKeyError || null,
        jwtCompatible: privateKeyValid,
        rs256Ready: privateKeyValid
      },
      recommendations: generateRecommendations(allCoreValid, allGoogleWalletValid, privateKeyValid)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Environment validation error:', error)
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: 'Failed to validate environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(coreValid: boolean, googleWalletValid: boolean, privateKeyValid: boolean): string[] {
  const recommendations = []

  if (!coreValid) {
    recommendations.push('Configure missing core environment variables (Supabase)')
  }

  if (!googleWalletValid) {
    recommendations.push('Configure Google Wallet environment variables')
  }

  if (!privateKeyValid) {
    recommendations.push('Fix GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY format - ensure proper PEM format with escaped newlines')
    recommendations.push('Example format: "-----BEGIN PRIVATE KEY-----\\nMIIEvQIB...\\n-----END PRIVATE KEY-----"')
  }

  if (process.env.NODE_ENV === 'production') {
    recommendations.push('Consider using Google Cloud Secret Manager for production credentials')
    recommendations.push('Ensure .env.local is in .gitignore for security')
  }

  if (recommendations.length === 0) {
    recommendations.push('All environment variables are properly configured!')
  }

  return recommendations
} 