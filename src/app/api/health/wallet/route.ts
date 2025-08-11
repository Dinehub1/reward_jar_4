import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface WalletHealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  configured: boolean
  lastCheck?: string
  details?: any
  errors?: string[]
}

interface WalletHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  wallets: {
    apple: WalletHealthStatus
    google: WalletHealthStatus
    pwa: WalletHealthStatus
  }
  summary: {
    total_configured: number
    healthy_count: number
    error_count: number
  }
}

/**
 * GET /api/health/wallet
 * 
 * Checks health and configuration status of all wallet services
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    const errors: string[] = []

    // Check Apple Wallet configuration (support both Base64 certs and legacy key-id envs)
    const appleStatus: WalletHealthStatus = {
      service: 'apple',
      status: 'healthy',
      configured: false,
      lastCheck: timestamp,
      details: {},
      errors: []
    }

    try {
      const hasBase64 = !!(process.env.APPLE_CERT_BASE64 && process.env.APPLE_KEY_BASE64 && process.env.APPLE_WWDR_BASE64)
      const hasLegacy = !!(process.env.APPLE_TEAM_ID && process.env.APPLE_PASS_TYPE_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)

      if (hasBase64) {
        appleStatus.configured = true
        appleStatus.details = {
          cert_base64: process.env.APPLE_CERT_BASE64 ? 'configured' : 'missing',
          key_base64: process.env.APPLE_KEY_BASE64 ? 'configured' : 'missing',
          wwdr_base64: process.env.APPLE_WWDR_BASE64 ? 'configured' : 'missing'
        }
      } else if (hasLegacy) {
        appleStatus.configured = true
        appleStatus.details = {
          teamId: process.env.APPLE_TEAM_ID ? 'configured' : 'missing',
          passTypeId: process.env.APPLE_PASS_TYPE_ID ? 'configured' : 'missing',
          keyId: process.env.APPLE_KEY_ID ? 'configured' : 'missing',
          privateKey: process.env.APPLE_PRIVATE_KEY ? 'configured' : 'missing'
        }
      } else {
        appleStatus.status = 'unhealthy'
        const missing: string[] = []
        if (!hasBase64) {
          if (!process.env.APPLE_CERT_BASE64) missing.push('APPLE_CERT_BASE64')
          if (!process.env.APPLE_KEY_BASE64) missing.push('APPLE_KEY_BASE64')
          if (!process.env.APPLE_WWDR_BASE64) missing.push('APPLE_WWDR_BASE64')
        }
        if (!hasLegacy) {
          if (!process.env.APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID')
          if (!process.env.APPLE_PASS_TYPE_ID) missing.push('APPLE_PASS_TYPE_ID')
          if (!process.env.APPLE_KEY_ID) missing.push('APPLE_KEY_ID')
          if (!process.env.APPLE_PRIVATE_KEY) missing.push('APPLE_PRIVATE_KEY')
        }
        appleStatus.errors = [`Missing environment variables (either Base64 set or Legacy set): ${Array.from(new Set(missing)).join(', ')}`]
      }
    } catch (error) {
      appleStatus.status = 'unhealthy'
      appleStatus.errors = [`Configuration check failed: ${error}`]
    }

    // Check Google Wallet configuration (support file path or JSON env)
    const googleStatus: WalletHealthStatus = {
      service: 'google',
      status: 'healthy',
      configured: false,
      lastCheck: timestamp,
      details: {},
      errors: []
    }

    try {
      const hasCredsPath = !!process.env.GOOGLE_APPLICATION_CREDENTIALS
      const hasCredsJson = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      const hasIssuer = !!(process.env.GOOGLE_WALLET_ISSUER_ID || process.env.GOOGLE_ISSUER_ID)
      const hasAnySuffix = !!(
        process.env.GOOGLE_WALLET_CLASS_SUFFIX ||
        process.env.GOOGLE_WALLET_CLASS_SUFFIX_STAMP ||
        process.env.GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP
      )

      if ((hasCredsPath || hasCredsJson) && hasIssuer && hasAnySuffix) {
        googleStatus.configured = true
        googleStatus.details = {
          credentials: hasCredsPath || hasCredsJson ? 'configured' : 'missing',
          issuerId: hasIssuer ? 'configured' : 'missing',
          classSuffix: hasAnySuffix ? 'configured' : 'missing'
        }
      } else {
        googleStatus.status = 'unhealthy'
        const missing: string[] = []
        if (!hasCredsPath && !hasCredsJson) missing.push('GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON')
        if (!hasIssuer) missing.push('GOOGLE_WALLET_ISSUER_ID or GOOGLE_ISSUER_ID')
        if (!hasAnySuffix) missing.push('GOOGLE_WALLET_CLASS_SUFFIX[_STAMP|_MEMBERSHIP]')
        googleStatus.errors = [`Missing environment variables: ${missing.join(', ')}`]
        googleStatus.details = {
          credentials: hasCredsPath || hasCredsJson ? 'configured' : 'missing',
          issuerId: hasIssuer ? 'configured' : 'missing',
          classSuffix: hasAnySuffix ? 'configured' : 'missing'
        }
      }
    } catch (error) {
      googleStatus.status = 'unhealthy'
      googleStatus.errors = [`Configuration check failed: ${error}`]
    }

    // Check PWA Wallet configuration
    const pwaStatus: WalletHealthStatus = {
      service: 'pwa',
      status: 'healthy',
      configured: true, // PWA is always available
      lastCheck: timestamp,
      details: {
        manifestSupport: true,
        serviceWorkerSupport: true,
        pushNotificationSupport: true
      },
      errors: []
    }

    // Check database connectivity for wallet-related tables
    try {
      const supabase = createAdminClient()
      
      // Test wallet-related table access
      const { error: customerCardsError } = await supabase
        .from('customer_cards')
        .select('id')
        .limit(1)

      if (customerCardsError) {
        errors.push(`Database connectivity issue: ${customerCardsError.message}`)
      }
    } catch (error) {
      errors.push(`Database check failed: ${error}`)
    }

    // Calculate summary
    const wallets = { apple: appleStatus, google: googleStatus, pwa: pwaStatus }
    const configured = Object.values(wallets).filter(w => w.configured)
    const healthy = Object.values(wallets).filter(w => w.status === 'healthy')

    const response: WalletHealthResponse = {
      status: errors.length > 0 ? 'unhealthy' : (configured.length === 3 ? 'healthy' : 'degraded'),
      timestamp,
      wallets,
      summary: {
        total_configured: configured.length,
        healthy_count: healthy.length,
        error_count: errors.length
      }
    }

    // Return 200 for healthy and degraded, 503 only for completely unhealthy
    const statusCode = response.status === 'unhealthy' ? 503 : 200

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}