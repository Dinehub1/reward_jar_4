/**
 * Wallet Chain Health API
 * 
 * Comprehensive health monitoring for the unified wallet chain system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { walletGenerationService } from '@/lib/wallet/wallet-generation-service'
import { getWalletFeatureFlags, validateEnvironmentForFeatures } from '@/lib/wallet/feature-flags'
import type { ApiResponse } from '@/lib/supabase/types'

interface WalletChainHealth {
  overall: 'healthy' | 'warning' | 'critical'
  timestamp: string
  components: {
    supabase: {
      status: 'healthy' | 'warning' | 'critical'
      connectivity: boolean
      responseTime: number
      tables: {
        stamp_cards: number
        membership_cards: number
        customer_cards: number
        wallet_update_queue: number
      }
    }
    queue: {
      status: 'healthy' | 'warning' | 'critical'
      pending: number
      processing: number
      completed: number
      failed: number
      successRate: number
      averageProcessingTime: number
    }
    environment: {
      status: 'healthy' | 'warning' | 'critical'
      featureFlags: any
      missingVariables: string[]
      warnings: string[]
    }
    platforms: {
      apple: {
        status: 'healthy' | 'warning' | 'disabled'
        configured: boolean
        lastGenerated?: string
      }
      google: {
        status: 'healthy' | 'warning' | 'disabled'
        configured: boolean
        lastGenerated?: string
      }
      pwa: {
        status: 'healthy' | 'warning' | 'disabled'
        configured: boolean
        lastGenerated?: string
      }
    }
  }
  recentActivity: {
    lastHour: number
    last24Hours: number
    last7Days: number
    recentErrors: Array<{
      timestamp: string
      error: string
      component: string
    }>
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('🏥 WALLET HEALTH: Starting comprehensive health check...')

  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Admin role verification
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Start parallel health checks
    const [
      supabaseHealth,
      queueHealth,
      environmentHealth,
      platformsHealth,
      activityHealth
    ] = await Promise.all([
      checkSupabaseHealth(adminClient),
      checkQueueHealth(),
      checkEnvironmentHealth(),
      checkPlatformsHealth(),
      checkRecentActivity(adminClient)
    ])

    // Determine overall health status
    const componentStatuses = [
      supabaseHealth.status,
      queueHealth.status,
      environmentHealth.status,
      ...Object.values(platformsHealth).map(p => p.status === 'disabled' ? 'healthy' : p.status)
    ]

    const overall = componentStatuses.includes('critical') ? 'critical' :
                   componentStatuses.includes('warning') ? 'warning' : 'healthy'

    const health: WalletChainHealth = {
      overall,
      timestamp: new Date().toISOString(),
      components: {
        supabase: supabaseHealth,
        queue: queueHealth,
        environment: environmentHealth,
        platforms: platformsHealth
      },
      recentActivity: activityHealth
    }

    console.log(`✅ WALLET HEALTH: Check completed in ${Date.now() - startTime}ms - Status: ${overall}`)

    return NextResponse.json({
      success: true,
      data: health,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('💥 WALLET HEALTH: Critical error during health check:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Check Supabase database health and connectivity
 */
async function checkSupabaseHealth(adminClient: any) {
  const startTime = Date.now()
  
  try {
    // Test basic connectivity with a simple query
    const { data: connectionTest, error: connectionError } = await adminClient
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      throw connectionError
    }

    // Get table counts
    const [stampCardsResult, membershipCardsResult, customerCardsResult, queueResult] = await Promise.all([
      adminClient.from('stamp_cards').select('count'),
      adminClient.from('membership_cards').select('count'),
      adminClient.from('customer_cards').select('count'),
      adminClient.from('wallet_update_queue').select('count')
    ])

    const responseTime = Date.now() - startTime

    return {
      status: responseTime > 2000 ? 'warning' : 'healthy' as 'healthy' | 'warning' | 'critical',
      connectivity: true,
      responseTime,
      tables: {
        stamp_cards: stampCardsResult.data?.length || 0,
        membership_cards: membershipCardsResult.data?.length || 0,
        customer_cards: customerCardsResult.data?.length || 0,
        wallet_update_queue: queueResult.data?.length || 0
      }
    }
  } catch (error) {
    return {
      status: 'critical' as const,
      connectivity: false,
      responseTime: Date.now() - startTime,
      tables: {
        stamp_cards: 0,
        membership_cards: 0,
        customer_cards: 0,
        wallet_update_queue: 0
      }
    }
  }
}

/**
 * Check wallet generation queue health
 */
async function checkQueueHealth() {
  try {
    const queueStatus = walletGenerationService.getQueueStatus()
    
    const totalProcessed = queueStatus.completed.length + queueStatus.failed.length
    const successRate = totalProcessed > 0 
      ? (queueStatus.completed.length / totalProcessed) * 100 
      : 100

    const averageProcessingTime = queueStatus.completed.length > 0
      ? queueStatus.completed.reduce((sum, r) => sum + r.processingTime, 0) / queueStatus.completed.length
      : 0

    // Determine queue health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (queueStatus.pending.length > 50 || queueStatus.failed.length > 10) {
      status = 'critical'
    } else if (queueStatus.pending.length > 20 || successRate < 95) {
      status = 'warning'
    }

    return {
      status,
      pending: queueStatus.pending.length,
      processing: queueStatus.processing.length,
      completed: queueStatus.completed.length,
      failed: queueStatus.failed.length,
      successRate: Math.round(successRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime)
    }
  } catch (error) {
    return {
      status: 'critical' as const,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      successRate: 0,
      averageProcessingTime: 0
    }
  }
}

/**
 * Check environment configuration health
 */
async function checkEnvironmentHealth() {
  try {
    const featureFlags = getWalletFeatureFlags()
    const envValidation = validateEnvironmentForFeatures()

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (envValidation.missing.length > 0) {
      status = 'critical'
    } else if (envValidation.warnings.length > 0) {
      status = 'warning'
    }

    return {
      status,
      featureFlags,
      missingVariables: envValidation.missing,
      warnings: envValidation.warnings
    }
  } catch (error) {
    return {
      status: 'critical' as const,
      featureFlags: {},
      missingVariables: ['Environment validation failed'],
      warnings: []
    }
  }
}

/**
 * Check individual platform health
 */
async function checkPlatformsHealth() {
  const featureFlags = getWalletFeatureFlags()
  
  return {
    apple: {
      status: !featureFlags.appleWallet ? 'disabled' : 
              (!process.env.APPLE_PASS_TYPE_ID ? 'critical' : 'healthy') as 'healthy' | 'warning' | 'disabled',
      configured: !!(process.env.APPLE_PASS_TYPE_ID && process.env.APPLE_TEAM_ID),
      lastGenerated: undefined // TODO: Track in database
    },
    google: {
      status: !featureFlags.googleWallet ? 'disabled' :
              (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'critical' : 'healthy') as 'healthy' | 'warning' | 'disabled',
      configured: !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_WALLET_ISSUER_ID),
      lastGenerated: undefined // TODO: Track in database
    },
    pwa: {
      status: !featureFlags.pwaCards ? 'disabled' : 'healthy' as 'healthy' | 'warning' | 'disabled',
      configured: featureFlags.pwaCards,
      lastGenerated: undefined // TODO: Track in database
    }
  }
}

/**
 * Check recent activity and errors
 */
async function checkRecentActivity(adminClient: any) {
  try {
    // Get recent queue activity from the last 7 days
    const { data: recentQueue, error: queueError } = await adminClient
      .from('wallet_update_queue')
      .select('created_at, failed, processed, error_message')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (queueError) {
      console.error('Error fetching recent queue activity:', queueError)
      return {
        lastHour: 0,
        last24Hours: 0,
        last7Days: 0,
        recentErrors: []
      }
    }

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const lastHour = recentQueue?.filter((item: any) => 
      new Date(item.created_at).getTime() > oneHourAgo
    ).length || 0

    const last24Hours = recentQueue?.filter((item: any) => 
      new Date(item.created_at).getTime() > oneDayAgo
    ).length || 0

    const recentErrors = recentQueue?.filter((item: any) => item.failed && item.error_message)
      .slice(0, 10)
      .map((item: any) => ({
        timestamp: item.created_at,
        error: item.error_message,
        component: 'wallet_queue'
      })) || []

    return {
      lastHour,
      last24Hours,
      last7Days: recentQueue?.length || 0,
      recentErrors
    }
  } catch (error) {
    return {
      lastHour: 0,
      last24Hours: 0,
      last7Days: 0,
      recentErrors: [{
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'health_check'
      }]
    }
  }
}