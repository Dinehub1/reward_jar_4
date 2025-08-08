/**
 * Unified Wallet Provisioning API for RewardJar 4.0
 * 
 * Handles wallet generation requests with queue processing and verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { walletGenerationService, isWalletGenerationEnabled } from '@/lib/wallet/wallet-generation-service'
import type { ApiResponse } from '@/lib/supabase/types'

// Feature flag check
function checkFeatureFlag(): { enabled: boolean; reason?: string } {
  if (process.env.DISABLE_WALLET_PROVISIONING === 'true') {
    return { enabled: false, reason: 'Wallet provisioning is temporarily disabled' }
  }
  
  if (!isWalletGenerationEnabled()) {
    return { enabled: false, reason: 'Wallet generation service is disabled' }
  }
  
  return { enabled: true }
}

/**
 * POST - Generate wallet passes for a card
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🎫 WALLET PROVISION: Starting wallet generation request...')
  
  try {
    // Feature flag check
    const featureCheck = checkFeatureFlag()
    if (!featureCheck.enabled) {
      return NextResponse.json({
        success: false,
        error: featureCheck.reason,
        featureFlag: 'wallet_provisioning_disabled'
      } as ApiResponse<never>, { status: 503 })
    }
    
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ WALLET PROVISION: Authentication failed:', authError?.message)
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
      console.log('❌ WALLET PROVISION: Access denied, user role:', userData?.role_id)
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { 
      cardId, 
      customerId, 
      types = ['apple', 'google', 'pwa'], 
      priority = 'normal',
      metadata = {}
    } = body

    // Validate request
    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: 'Card ID is required'
      } as ApiResponse<never>, { status: 400 })
    }

    if (!Array.isArray(types) || types.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one wallet type must be specified'
      } as ApiResponse<never>, { status: 400 })
    }

    const validTypes = ['apple', 'google', 'pwa']
    const invalidTypes = types.filter(type => !validTypes.includes(type))
    if (invalidTypes.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid wallet types: ${invalidTypes.join(', ')}`
      } as ApiResponse<never>, { status: 400 })
    }

    // Verify card exists
    const cardExists = await verifyCardExists(cardId)
    if (!cardExists.exists) {
      return NextResponse.json({
        success: false,
        error: cardExists.error || 'Card not found'
      } as ApiResponse<never>, { status: 404 })
    }

    // Enqueue wallet generation
    console.log(`📝 WALLET PROVISION: Enqueueing generation for card ${cardId}`)
    const requestId = await walletGenerationService.enqueueGeneration({
      cardId,
      customerId,
      types,
      priority,
      metadata: {
        ...metadata,
        requestedBy: user.id,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    })

    // Return immediate response with request ID
    const response = {
      success: true,
      data: {
        requestId,
        cardId,
        customerId,
        types,
        priority,
        status: 'queued',
        estimatedProcessingTime: '30-60 seconds',
        statusUrl: `/api/admin/wallet-provision/status/${requestId}`
      },
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }

    console.log(`✅ WALLET PROVISION: Request ${requestId} queued successfully`)
    
    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': requestId,
        'X-Processing-Time': `${Date.now() - startTime}ms`
      }
    })

  } catch (error) {
    console.error('💥 WALLET PROVISION: Critical error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * GET - Get queue status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    const featureCheck = checkFeatureFlag()
    if (!featureCheck.enabled) {
      return NextResponse.json({
        success: false,
        error: featureCheck.reason,
        featureFlag: 'wallet_provisioning_disabled'
      } as ApiResponse<never>, { status: 503 })
    }

    // Authentication check (same as POST)
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Get queue status
    const queueStatus = walletGenerationService.getQueueStatus()
    
    // Calculate statistics
    const stats = {
      pending: queueStatus.pending.length,
      processing: queueStatus.processing.length,
      completed: queueStatus.completed.length,
      failed: queueStatus.failed.length,
      totalProcessed: queueStatus.completed.length + queueStatus.failed.length,
      successRate: queueStatus.completed.length + queueStatus.failed.length > 0 
        ? (queueStatus.completed.length / (queueStatus.completed.length + queueStatus.failed.length) * 100).toFixed(1)
        : '0',
      averageProcessingTime: queueStatus.completed.length > 0
        ? Math.round(queueStatus.completed.reduce((sum, r) => sum + r.processingTime, 0) / queueStatus.completed.length)
        : 0
    }

    const response = {
      success: true,
      data: {
        queue: queueStatus,
        statistics: stats,
        serviceStatus: {
          enabled: isWalletGenerationEnabled(),
          featureFlags: {
            walletProvisioning: process.env.DISABLE_WALLET_PROVISIONING !== 'true',
            appleWallet: !!process.env.APPLE_PASS_TYPE_ID,
            googleWallet: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
          }
        }
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ WALLET PROVISION: Error getting queue status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get queue status',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * DELETE - Clear queue history (completed and failed)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check (admin only)
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

    // Clear queue history
    walletGenerationService.clearHistory()

    return NextResponse.json({
      success: true,
      message: 'Queue history cleared',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ WALLET PROVISION: Error clearing queue:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear queue history'
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Verify that a card exists in the database
 */
async function verifyCardExists(cardId: string): Promise<{ exists: boolean; type?: string; error?: string }> {
  try {
    const adminClient = createAdminClient()
    
    // Check stamp cards
    const { data: stampCard, error: stampError } = await adminClient
      .from('stamp_cards')
      .select('id, status')
      .eq('id', cardId)
      .single()
    
    if (!stampError && stampCard) {
      return { exists: true, type: 'stamp' }
    }
    
    // Check membership cards
    const { data: membershipCard, error: memberError } = await adminClient
      .from('membership_cards')
      .select('id, status')
      .eq('id', cardId)
      .single()
    
    if (!memberError && membershipCard) {
      return { exists: true, type: 'membership' }
    }
    
    return { exists: false, error: 'Card not found in database' }
    
  } catch (error) {
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Database error' 
    }
  }
}