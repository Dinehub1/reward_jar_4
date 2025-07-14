import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    apple_wallet: false,
    google_wallet: false,
    pwa_wallet: true, // Always available
    environment_vars: false
  }

  const environment = {
    APPLE_TEAM_IDENTIFIER: !!process.env.APPLE_TEAM_IDENTIFIER,
    APPLE_PASS_TYPE_IDENTIFIER: !!process.env.APPLE_PASS_TYPE_IDENTIFIER,
    APPLE_CERT_BASE64: !!process.env.APPLE_CERT_BASE64,
    APPLE_KEY_BASE64: !!process.env.APPLE_KEY_BASE64,
    APPLE_WWDR_BASE64: !!process.env.APPLE_WWDR_BASE64,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    GOOGLE_CLASS_ID: !!process.env.GOOGLE_CLASS_ID
  }

  // Check Apple Wallet configuration
  const appleRequiredVars = [
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_PASS_TYPE_IDENTIFIER',
    'APPLE_CERT_BASE64',
    'APPLE_KEY_BASE64',
    'APPLE_WWDR_BASE64'
  ]
  
  const appleConfigured = appleRequiredVars.every(varName => !!process.env[varName])
  
  if (appleConfigured) {
    try {
      // Validate certificate format
      const certValid = validateAppleCertificate()
      checks.apple_wallet = certValid
    } catch (error) {
      console.error('Apple Wallet validation failed:', error)
      checks.apple_wallet = false
    }
  }

  // Check Google Wallet configuration
  const googleRequiredVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_CLASS_ID'
  ]
  
  const googleConfigured = googleRequiredVars.every(varName => !!process.env[varName])
  
  if (googleConfigured) {
    try {
      // Validate service account format
      const authValid = validateGoogleAuth()
      checks.google_wallet = authValid
    } catch (error) {
      console.error('Google Wallet validation failed:', error)
      checks.google_wallet = false
    }
  }

  // Environment variables check
  const allRequiredVars = [
    'BASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    ...appleRequiredVars,
    ...googleRequiredVars
  ]

  const envVarsPresent = allRequiredVars.filter(varName => !!process.env[varName]).length
  const envVarsTotal = allRequiredVars.length
  checks.environment_vars = envVarsPresent >= (envVarsTotal * 0.8) // 80% threshold

  const allHealthy = Object.values(checks).every(Boolean)

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    environment,
    wallet_availability: {
      apple: checks.apple_wallet ? 'available' : 'unavailable',
      google: checks.google_wallet ? 'available' : 'unavailable',
      pwa: 'available'
    },
    environment_summary: {
      present: envVarsPresent,
      total: envVarsTotal,
      percentage: Math.round((envVarsPresent / envVarsTotal) * 100)
    }
  }, {
    status: allHealthy ? 200 : 503
  })
}

function validateAppleCertificate(): boolean {
  try {
    // Check if certificates are base64 encoded and not placeholders
    const cert = process.env.APPLE_CERT_BASE64
    const key = process.env.APPLE_KEY_BASE64
    const wwdr = process.env.APPLE_WWDR_BASE64

    if (!cert || !key || !wwdr) return false
    
    // Check for placeholder values
    if (cert === 'xx' || key === 'xx' || wwdr === 'xx') return false
    
    // Try to decode base64
    const certDecoded = Buffer.from(cert, 'base64').toString()
    const keyDecoded = Buffer.from(key, 'base64').toString()
    const wwdrDecoded = Buffer.from(wwdr, 'base64').toString()
    
    // Check if they look like valid certificates
    const certValid = certDecoded.includes('-----BEGIN') && certDecoded.includes('-----END')
    const keyValid = keyDecoded.includes('-----BEGIN') && keyDecoded.includes('-----END')
    const wwdrValid = wwdrDecoded.includes('-----BEGIN') && wwdrDecoded.includes('-----END')
    
    return certValid && keyValid && wwdrValid
  } catch (error) {
    return false
  }
}

function validateGoogleAuth(): boolean {
  try {
    // Check service account email format
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    if (!email || !email.includes('@') || !email.includes('.iam.gserviceaccount.com')) {
      return false
    }
    
    // Check private key format
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return false
    }
    
    // Check class ID format
    const classId = process.env.GOOGLE_CLASS_ID
    if (!classId || !classId.includes('.')) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
} 