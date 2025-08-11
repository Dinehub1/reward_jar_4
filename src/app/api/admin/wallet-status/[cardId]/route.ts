import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

interface WalletStatus {
  type: 'apple' | 'google' | 'pwa'
  status: 'pending' | 'provisioned' | 'failed' | 'not_supported'
  lastUpdated?: string
  error?: string
}

/**
 * GET /api/admin/wallet-status/[cardId]
 * 
 * Gets wallet provisioning status for a loyalty card
 * Requires admin authentication (role_id = 1)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params


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

    // Get provisioning status from database
    const { data: statusData, error: statusError } = await supabase
      .from('wallet_provisioning_status')
      .select('*')
      .eq('card_id', cardId)
      .single()

    let statuses: WalletStatus[] = []

    if (statusData && !statusError) {
      // Return stored statuses
      statuses = [
        {
          type: 'apple',
          status: statusData.apple_status as WalletStatus['status'],
          lastUpdated: statusData.last_updated
        },
        {
          type: 'google',
          status: statusData.google_status as WalletStatus['status'],
          lastUpdated: statusData.last_updated
        },
        {
          type: 'pwa',
          status: statusData.pwa_status as WalletStatus['status'],
          lastUpdated: statusData.last_updated
        }
      ]
    } else {
      // Default statuses if not provisioned yet
      statuses = [
        { type: 'apple', status: 'pending' },
        { type: 'google', status: 'pending' },
        { type: 'pwa', status: 'pending' }
      ]
    }


    return NextResponse.json({
      success: true,
      data: { statuses },
      message: 'Wallet status retrieved successfully'
    } as ApiResponse<{ statuses: WalletStatus[] }>)

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}