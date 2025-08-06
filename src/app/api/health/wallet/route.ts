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

    // Check Apple Wallet configuration
    const appleStatus: WalletHealthStatus = {
      service: 'apple',
      status: 'healthy',
      configured: false,
      lastCheck: timestamp,
      details: {},
      errors: []
    }

    try {
      const requiredEnvVars = [
        'APPLE_TEAM_ID',
        'APPLE_PASS_TYPE_ID', 
        'APPLE_KEY_ID',
        'APPLE_PRIVATE_KEY'
      ]

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
      
      if (missingVars.length === 0) {
        appleStatus.configured = true
        appleStatus.details = {
          teamId: process.env.APPLE_TEAM_ID ? 'configured' : 'missing',
          passTypeId: process.env.APPLE_PASS_TYPE_ID ? 'configured' : 'missing',
          keyId: process.env.APPLE_KEY_ID ? 'configured' : 'missing',
          privateKey: process.env.APPLE_PRIVATE_KEY ? 'configured' : 'missing'
        }
      } else {
        appleStatus.status = 'unhealthy'
        appleStatus.errors = [`Missing environment variables: ${missingVars.join(', ')}`]
      }
    } catch (error) {
      appleStatus.status = 'unhealthy'
      appleStatus.errors = [`Configuration check failed: ${error}`]
    }

    // Check Google Wallet configuration  
    const googleStatus: WalletHealthStatus = {
      service: 'google',
      status: 'healthy',
      configured: false,
      lastCheck: timestamp,
      details: {},
      errors: []
    }

    try {
      const requiredEnvVars = [
        'GOOGLE_APPLICATION_CREDENTIALS',
        'GOOGLE_WALLET_ISSUER_ID',
        'GOOGLE_WALLET_CLASS_SUFFIX'
      ]

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
      
      if (missingVars.length === 0) {
        googleStatus.configured = true
        googleStatus.details = {
          credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'configured' : 'missing',
          issuerId: process.env.GOOGLE_WALLET_ISSUER_ID ? 'configured' : 'missing',
          classSuffix: process.env.GOOGLE_WALLET_CLASS_SUFFIX ? 'configured' : 'missing'
        }
      } else {
        googleStatus.status = 'unhealthy'
        googleStatus.errors = [`Missing environment variables: ${missingVars.join(', ')}`]
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
    console.error('💥 WALLET HEALTH CHECK ERROR:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}