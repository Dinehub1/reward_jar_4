import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

interface WalletProvisionRequest {
  cardId: string
  cardName: string
}

interface WalletStatus {
  type: 'apple' | 'google' | 'pwa'
  status: 'pending' | 'provisioned' | 'failed' | 'not_supported'
  lastUpdated: string
  error?: string
}

/**
 * GET /api/admin/wallet-provision
 * 
 * Health check for wallet provisioning service
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        service: 'wallet-provision',
        status: 'operational',
        supportedWallets: ['apple', 'google', 'pwa'],
        timestamp: new Date().toISOString()
      },
      message: 'Wallet provisioning service is operational'
    } as ApiResponse<any>)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' } as ApiResponse<never>,
      { status: 503 }
    )
  }
}

/**
 * POST /api/admin/wallet-provision
 * 
 * Provisions a loyalty card to multiple wallet platforms
 * Requires admin authentication (role_id = 1)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WalletProvisionRequest
    const { cardId, cardName } = body

    console.log('🔍 Wallet Provision API: Provisioning card:', { cardId, cardName })

    // Verify admin access
    const supabase = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Get card details
    const { data: cardData, error: cardError } = await supabase
      .from('stamp_cards')
      .select(`
        *,
        businesses (
          id,
          name,
          contact_email
        )
      `)
      .eq('id', cardId)
      .single()

    if (cardError || !cardData) {
      return NextResponse.json(
        { success: false, error: 'Card not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    const statuses: WalletStatus[] = []
    const timestamp = new Date().toISOString()

    // Apple Wallet Provisioning
    try {
      const appleResult = await provisionAppleWallet(cardData)
      statuses.push({
        type: 'apple',
        status: appleResult.success ? 'provisioned' : 'failed',
        lastUpdated: timestamp,
        error: appleResult.error
      })
    } catch (error) {
      statuses.push({
        type: 'apple',
        status: 'failed',
        lastUpdated: timestamp,
        error: 'Apple Wallet provisioning failed'
      })
    }

    // Google Wallet Provisioning
    try {
      const googleResult = await provisionGoogleWallet(cardData)
      statuses.push({
        type: 'google',
        status: googleResult.success ? 'provisioned' : 'failed',
        lastUpdated: timestamp,
        error: googleResult.error
      })
    } catch (error) {
      statuses.push({
        type: 'google',
        status: 'failed',
        lastUpdated: timestamp,
        error: 'Google Wallet provisioning failed'
      })
    }

    // PWA Wallet (always succeeds as fallback)
    try {
      const pwaResult = await provisionPWAWallet(cardData)
      statuses.push({
        type: 'pwa',
        status: 'provisioned',
        lastUpdated: timestamp
      })
    } catch (error) {
      statuses.push({
        type: 'pwa',
        status: 'failed',
        lastUpdated: timestamp,
        error: 'PWA provisioning failed'
      })
    }

    // Store provisioning status in database
    try {
      await supabase
        .from('wallet_provisioning_status')
        .upsert({
          card_id: cardId,
          apple_status: statuses.find(s => s.type === 'apple')?.status || 'failed',
          google_status: statuses.find(s => s.type === 'google')?.status || 'failed',
          pwa_status: statuses.find(s => s.type === 'pwa')?.status || 'failed',
          last_updated: timestamp,
          metadata: {
            card_name: cardName,
            provisioning_admin: user.id,
            statuses
          }
        })
    } catch (statusError) {
      console.warn('⚠️ Failed to store provisioning status:', statusError)
    }

    console.log('✅ Wallet provisioning completed:', statuses)

    return NextResponse.json({
      success: true,
      data: { statuses },
      message: 'Wallet provisioning completed'
    } as ApiResponse<{ statuses: WalletStatus[] }>)

  } catch (error) {
    console.error('❌ Wallet Provision API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

// Apple Wallet provisioning logic
async function provisionAppleWallet(cardData: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock Apple Wallet provisioning
    // In production, this would:
    // 1. Generate PKPass file with proper Pass Type ID
    // 2. Sign with Apple certificates
    // 3. Upload to Apple Wallet servers
    // 4. Return pass URL or status
    
    console.log('📱 Provisioning Apple Wallet for:', cardData.name)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock success (90% success rate)
    const success = Math.random() > 0.1
    
    return {
      success,
      error: success ? undefined : 'Apple Wallet service unavailable'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Apple Wallet provisioning failed'
    }
  }
}

// Google Wallet provisioning logic
async function provisionGoogleWallet(cardData: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock Google Wallet provisioning
    // In production, this would:
    // 1. Create loyalty class if not exists
    // 2. Generate JWT with card details
    // 3. Sign with Google credentials
    // 4. Return wallet URL or status
    
    console.log('📱 Provisioning Google Wallet for:', cardData.name)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock success (85% success rate)
    const success = Math.random() > 0.15
    
    return {
      success,
      error: success ? undefined : 'Google Wallet service temporarily unavailable'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Google Wallet provisioning failed'
    }
  }
}

// PWA Wallet provisioning (fallback)
async function provisionPWAWallet(cardData: any): Promise<{ success: boolean; error?: string }> {
  try {
    // PWA wallet is always available as universal fallback
    console.log('🌐 Provisioning PWA Wallet for:', cardData.name)
    
    // Simulate minimal delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: 'PWA wallet setup failed'
    }
  }
}