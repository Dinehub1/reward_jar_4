import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId
    const body = await request.json()
    const { updateType = 'auto', simulate = false, notes = null } = body

    console.log('🧪 Processing test-update request:', {
      customerCardId,
      updateType,
      simulate,
      notes
    })

    const supabase = await createClient()

    // Get customer card details
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        wallet_type,
        created_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('Customer card not found:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Customer card not found'
        },
        { status: 404 }
      )
    }

    // Handle the data structure properly
    const stampCardData = (customerCard.stamp_cards as unknown) as {
      id: string
      total_stamps: number
      name: string
      reward_description: string
      businesses: {
        id: string
        name: string
        description: string
      }
    }

    const businessData = stampCardData?.businesses as {
      id: string
      name: string
      description: string
    }

    if (!stampCardData || !businessData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Card data incomplete'
        },
        { status: 404 }
      )
    }

    // Determine card type
    const isMembership = customerCard.membership_type === 'gym' || customerCard.membership_type === 'membership'
    let actualUpdateType = updateType

    // Auto-detect update type if not specified
    if (updateType === 'auto') {
      actualUpdateType = isMembership ? 'session_update' : 'stamp_update'
    }

    console.log('🔍 Test update analysis:', {
      isMembership,
      membershipType: customerCard.membership_type,
      actualUpdateType,
      currentStamps: customerCard.current_stamps,
      totalStamps: stampCardData.total_stamps,
      sessionsUsed: customerCard.sessions_used,
      totalSessions: customerCard.total_sessions,
      walletType: customerCard.wallet_type
    })

    let result: any = {}

    if (simulate) {
      // Simulation mode - don't actually update data, just return what would happen
      if (isMembership && actualUpdateType === 'session_update') {
        const sessionsUsed = customerCard.sessions_used || 0
        const totalSessions = customerCard.total_sessions || 20

        result = {
          success: true,
          simulation: true,
          action: 'session_update_simulated',
          cardType: 'membership',
          currentState: {
            sessionsUsed,
            totalSessions,
            sessionsRemaining: totalSessions - sessionsUsed,
            isCompleted: sessionsUsed >= totalSessions
          },
          simulatedUpdate: {
            sessionsUsed: Math.min(sessionsUsed + 1, totalSessions),
            totalSessions,
            sessionsRemaining: Math.max(totalSessions - (sessionsUsed + 1), 0),
            isCompleted: (sessionsUsed + 1) >= totalSessions
          },
          message: 'Simulation: Would mark 1 session usage',
          businessName: businessData.name,
          membershipCost: customerCard.cost || 15000
        }
      } else if (!isMembership && actualUpdateType === 'stamp_update') {
        const currentStamps = customerCard.current_stamps || 0
        const totalStamps = stampCardData.total_stamps || 10

        result = {
          success: true,
          simulation: true,
          action: 'stamp_update_simulated',
          cardType: 'loyalty',
          currentState: {
            currentStamps,
            totalStamps,
            stampsRemaining: totalStamps - currentStamps,
            isCompleted: currentStamps >= totalStamps
          },
          simulatedUpdate: {
            currentStamps: Math.min(currentStamps + 1, totalStamps),
            totalStamps,
            stampsRemaining: Math.max(totalStamps - (currentStamps + 1), 0),
            isCompleted: (currentStamps + 1) >= totalStamps
          },
          message: 'Simulation: Would add 1 stamp',
          businessName: businessData.name,
          rewardDescription: stampCardData.reward_description
        }
      } else {
        return NextResponse.json({
          success: false,
          error: `Invalid update type '${actualUpdateType}' for ${isMembership ? 'membership' : 'loyalty'} card`
        }, { status: 400 })
      }
    } else {
      // Actual update mode - perform the update
      if (isMembership && actualUpdateType === 'session_update') {
        const sessionsUsed = customerCard.sessions_used || 0
        const totalSessions = customerCard.total_sessions || 20

        if (sessionsUsed >= totalSessions) {
          return NextResponse.json({
            success: false,
            error: 'No sessions remaining for test update',
            sessionsUsed,
            totalSessions
          })
        }

        // Record test session usage
        const { error: sessionError } = await supabase
          .from('session_usage')
          .insert({
            customer_card_id: customerCardId,
            business_id: businessData.id,
            marked_by: null,
            usage_type: 'session',
            notes: notes || 'Test update simulation - session marked'
          })

        if (sessionError) {
          console.error('Error recording test session usage:', sessionError)
          return NextResponse.json({
            success: false,
            error: 'Failed to record test session usage'
          }, { status: 500 })
        }

        // Update sessions used
        const { error: updateError } = await supabase
          .from('customer_cards')
          .update({
            sessions_used: sessionsUsed + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerCardId)

        if (updateError) {
          console.error('Error updating test sessions used:', updateError)
          return NextResponse.json({
            success: false,
            error: 'Failed to update test session count'
          }, { status: 500 })
        }

        result = {
          success: true,
          action: 'session_update_applied',
          cardType: 'membership',
          sessionsUsed: sessionsUsed + 1,
          totalSessions,
          sessionsRemaining: totalSessions - (sessionsUsed + 1),
          isCompleted: (sessionsUsed + 1) >= totalSessions,
          message: `Test session marked! ${totalSessions - (sessionsUsed + 1)} sessions remaining.`,
          businessName: businessData.name,
          membershipCost: customerCard.cost || 15000
        }

        if ((sessionsUsed + 1) >= totalSessions) {
          result.message = 'Test complete! All sessions used.'
          result.completionReward = 'Membership benefits fully utilized'
        }

      } else if (!isMembership && actualUpdateType === 'stamp_update') {
        const currentStamps = customerCard.current_stamps || 0
        const totalStamps = stampCardData.total_stamps || 10

        if (currentStamps >= totalStamps) {
          return NextResponse.json({
            success: false,
            error: 'Loyalty card already completed for test update',
            currentStamps,
            totalStamps
          })
        }

        // Record test stamp usage
        const { error: sessionError } = await supabase
          .from('session_usage')
          .insert({
            customer_card_id: customerCardId,
            business_id: businessData.id,
            marked_by: null,
            usage_type: 'stamp',
            notes: notes || 'Test update simulation - stamp added'
          })

        if (sessionError) {
          console.error('Error recording test stamp usage:', sessionError)
          return NextResponse.json({
            success: false,
            error: 'Failed to record test stamp usage'
          }, { status: 500 })
        }

        // Update stamps
        const { error: updateError } = await supabase
          .from('customer_cards')
          .update({
            current_stamps: currentStamps + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerCardId)

        if (updateError) {
          console.error('Error updating test stamps:', updateError)
          return NextResponse.json({
            success: false,
            error: 'Failed to update test stamp count'
          }, { status: 500 })
        }

        result = {
          success: true,
          action: 'stamp_update_applied',
          cardType: 'loyalty',
          currentStamps: currentStamps + 1,
          totalStamps,
          stampsRemaining: totalStamps - (currentStamps + 1),
          isCompleted: (currentStamps + 1) >= totalStamps,
          message: `Test stamp added! ${totalStamps - (currentStamps + 1)} more stamps needed.`,
          businessName: businessData.name,
          rewardDescription: stampCardData.reward_description
        }

        if ((currentStamps + 1) >= totalStamps) {
          result.message = 'Test complete! Reward is ready to claim.'
          result.rewardReady = true
        }

      } else {
        return NextResponse.json({
          success: false,
          error: `Invalid update type '${actualUpdateType}' for ${isMembership ? 'membership' : 'loyalty'} card`
        }, { status: 400 })
      }

      // Queue wallet updates for real-time synchronization (only for actual updates)
      try {
        const { error: queueError } = await supabase
          .from('wallet_update_queue')
          .insert({
            customer_card_id: customerCardId,
            update_type: actualUpdateType,
            metadata: {
              action: result.action,
              timestamp: new Date().toISOString(),
              businessId: businessData.id,
              businessName: businessData.name,
              isTestUpdate: true,
              ...(isMembership ? {
                sessionsUsed: result.sessionsUsed,
                totalSessions: result.totalSessions,
                sessionsRemaining: result.sessionsRemaining
              } : {
                currentStamps: result.currentStamps,
                totalStamps: result.totalStamps,
                stampsRemaining: result.stampsRemaining
              })
            },
            processed: false,
            created_at: new Date().toISOString()
          })

        if (queueError) {
          console.warn('Warning: Failed to queue test wallet update:', queueError)
        } else {
          console.log('✅ Test wallet update queued for real-time synchronization')
          result.walletUpdateQueued = true
        }
      } catch (queueError) {
        console.warn('Warning: Error queuing test wallet update:', queueError)
      }
    }

    // Add wallet-specific update URLs for testing
    result.walletUpdateUrls = {
      apple: `/api/wallet/apple/updates/test/${customerCardId}`,
      google: `/api/wallet/google/updates/test/${customerCardId}`,
      pwa: `/api/wallet/pwa/updates/test/${customerCardId}`
    }

    // Add current wallet type info
    result.currentWalletType = customerCard.wallet_type
    
    console.log('✅ Test update processed successfully:', result)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error processing test-update request:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 