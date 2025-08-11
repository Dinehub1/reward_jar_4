import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getEnvironmentHealth } from '@/lib/startup-validation'

/**
 * 🔧 CONSOLIDATED HEALTH CHECK ENDPOINT
 * 
 * Combines all health checks into a single comprehensive endpoint
 * Replaces: /api/health, /api/system/health, /api/health/environment, /api/health/wallet
 */
export async function GET() {
  try {
    const startTime = Date.now()
    
    // 1. Basic API Health
    const apiHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }

    // 2. Environment Health
    let environmentHealth
    try {
      environmentHealth = getEnvironmentHealth()
    } catch (error) {
      environmentHealth = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Environment check failed'
      }
    }

    // 3. Database Health
    let databaseHealth
    try {
      const supabase = await createServerClient()
      const { data, error } = await supabase
        .from('businesses')
        .select('count')
        .limit(1)
      
      databaseHealth = {
        status: error ? 'error' : 'healthy',
        connected: !error,
        error: error?.message,
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      databaseHealth = {
        status: 'error',
        connected: false,
        error: error instanceof Error ? error.message : 'Database connection failed'
      }
    }

    // 4. Wallet Services Health
    const walletHealth = {
      apple: {
        configured: !!(process.env.APPLE_CERT_BASE64 && process.env.APPLE_KEY_BASE64),
        status: 'ready'
      },
      google: {
        configured: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
        status: 'ready'
      },
      pwa: {
        configured: true,
        status: 'ready'
      }
    }

    // 5. Overall Health Status
    const overallStatus = 
      databaseHealth.status === 'healthy' && 
      environmentHealth.status !== 'error' ? 'healthy' : 'degraded'

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      services: {
        api: apiHealth,
        database: databaseHealth,
        environment: environmentHealth,
        wallets: walletHealth
      },
      summary: {
        healthy: overallStatus === 'healthy',
        database_connected: databaseHealth.connected,
        wallets_configured: Object.values(walletHealth).filter(w => w.configured).length,
        environment_issues: environmentHealth.status === 'error' ? 1 : 0
      }
    }

    return NextResponse.json(healthReport, {
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
}