import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const checks = {
      core_app: {
        status: 'healthy',
        variables: {} as Record<string, boolean>,
        count: 0
      },
      apple_wallet: {
        status: 'healthy',
        variables: {} as Record<string, boolean>,
        count: 0
      },
      google_wallet: {
        status: 'healthy',
        variables: {} as Record<string, boolean>,
        count: 0
      },
      security_analytics: {
        status: 'healthy',
        variables: {} as Record<string, boolean>,
        count: 0
      }
    }

    // Core Application variables (5)
    const coreVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'BASE_URL',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    ]

    coreVars.forEach(varName => {
      const exists = !!process.env[varName]
      checks.core_app.variables[varName] = exists
      if (exists) checks.core_app.count++
    })

    if (checks.core_app.count < coreVars.length) {
      checks.core_app.status = 'degraded'
    }

    // Apple Wallet variables (6)
    const appleVars = [
      'APPLE_CERT_BASE64',
      'APPLE_KEY_BASE64',
      'APPLE_WWDR_BASE64',
      'APPLE_CERT_PASSWORD',
      'APPLE_TEAM_IDENTIFIER',
      'APPLE_PASS_TYPE_IDENTIFIER'
    ]

    appleVars.forEach(varName => {
      const exists = !!process.env[varName]
      checks.apple_wallet.variables[varName] = exists
      if (exists) checks.apple_wallet.count++
    })

    if (checks.apple_wallet.count < appleVars.length) {
      checks.apple_wallet.status = 'unavailable'
    }

    // Google Wallet variables (3)
    const googleVars = [
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
      'GOOGLE_CLASS_ID'
    ]

    googleVars.forEach(varName => {
      const exists = !!process.env[varName]
      checks.google_wallet.variables[varName] = exists
      if (exists) checks.google_wallet.count++
    })

    if (checks.google_wallet.count < googleVars.length) {
      checks.google_wallet.status = 'unavailable'
    }

    // Security & Analytics variables (3)
    const securityVars = [
      'API_KEY',
      'NEXT_PUBLIC_POSTHOG_KEY',
      'NEXT_PUBLIC_POSTHOG_HOST'
    ]

    securityVars.forEach(varName => {
      const exists = !!process.env[varName]
      checks.security_analytics.variables[varName] = exists
      if (exists) checks.security_analytics.count++
    })

    if (checks.security_analytics.count < securityVars.length) {
      checks.security_analytics.status = 'optional'
    }

    // Overall status
    const overallHealthy = checks.core_app.status === 'healthy'
    const totalExpected = coreVars.length + appleVars.length + googleVars.length + securityVars.length
    const totalConfigured = checks.core_app.count + checks.apple_wallet.count + checks.google_wallet.count + checks.security_analytics.count

    return NextResponse.json({
      status: overallHealthy ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      summary: {
        total_variables: totalExpected,
        configured_variables: totalConfigured,
        completion_percentage: Math.round((totalConfigured / totalExpected) * 100)
      },
      checks,
      wallet_availability: {
        apple: checks.apple_wallet.status === 'healthy' ? 'available' : 'unavailable',
        google: checks.google_wallet.status === 'healthy' ? 'available' : 'unavailable',
        pwa: 'available' // PWA is always available
      },
      recommendations: [
        ...(checks.core_app.status !== 'healthy' ? ['Configure core application variables for basic functionality'] : []),
        ...(checks.apple_wallet.status !== 'healthy' ? ['Set up Apple Wallet certificates for iOS integration'] : []),
        ...(checks.google_wallet.status !== 'healthy' ? ['Configure Google Wallet service account for Android integration'] : []),
        ...(checks.security_analytics.status === 'optional' ? ['Add security and analytics variables for enhanced features'] : [])
      ]
    }, {
      status: overallHealthy ? 200 : 503
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Environment check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    })
  }
} 