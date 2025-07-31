import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser, getServerSession } from '@/lib/supabase/server'
import validateUUID from 'uuid-validate'

// Mark session or stamp usage via QR scan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId
    const body = await request.json()
    const { businessId, usageType = 'auto', notes = null } = body

    console.log('🔄 Processing QR scan mark-session request:', {
      customerCardId,
      businessId,
      usageType,
      notes
    })
    
    const supabase = await createServerClient()
    
    // Get customer card with stamp card details and membership info
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        stamp_card_id,
        membership_card_id,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
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
          error: 'Customer card not found',
          success: false 
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
          error: 'Card data incomplete',
          success: false 
        },
        { status: 404 }
      )
    }
    
    // Validate business ID if provided
    if (businessId && businessId !== businessData.id) {
      return NextResponse.json(
        { 
          error: 'Business ID mismatch',
          success: false 
        },
        { status: 403 }
      )
    }

    // Determine card type and appropriate action
    const isMembership = customerCard.membership_card_id !== null
    let actualUsageType = usageType

    // Auto-detect usage type if not specified
    if (usageType === 'auto') {
      actualUsageType = isMembership ? 'session' : 'stamp'
    }

    console.log('🔍 Card analysis:', {
      isMembership,
      cardType: isMembership ? 'membership' : 'stamp',
      actualUsageType,
      currentStamps: customerCard.current_stamps,
      totalStamps: stampCardData.total_stamps,
      sessionsUsed: customerCard.sessions_used,
      totalSessions: customerCard.total_sessions,
      expiry: customerCard.expiry_date
    })

    let result: any = {}

    if (isMembership && actualUsageType === 'session') {
      // Handle membership session marking
      const sessionsUsed = customerCard.sessions_used || 0
      const totalSessions = customerCard.total_sessions || 20

      // Check if sessions remaining
      if (sessionsUsed >= totalSessions) {
        return NextResponse.json({
          success: false,
            error: 'No sessions remaining',
          sessionsUsed,
          totalSessions,
          sessionsRemaining: 0
        })
      }
      
      // Check expiry
      if (customerCard.expiry_date && new Date(customerCard.expiry_date) < new Date()) {
        return NextResponse.json({
          success: false,
            error: 'Membership expired',
          expiry: customerCard.expiry_date,
          sessionsUsed,
          totalSessions
        })
      }

      // Record session usage
      const { error: sessionError } = await supabase
        .from('session_usage')
        .insert({
          customer_card_id: customerCardId,
          business_id: businessData.id,
          marked_by: null, // QR scan doesn't have a specific user
          usage_type: 'session',
          notes: notes || `QR scan session marking at ${businessData.name}`
        })

      if (sessionError) {
        console.error('Error recording session usage:', sessionError)
        return NextResponse.json({
          success: false,
          error: 'Failed to record session usage'
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
        console.error('Error updating sessions used:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update session count'
        }, { status: 500 })
      }

      result = {
        success: true,
        action: 'session_marked',
        cardType: 'membership',
        sessionsUsed: sessionsUsed + 1,
        totalSessions,
        sessionsRemaining: totalSessions - (sessionsUsed + 1),
        isCompleted: (sessionsUsed + 1) >= totalSessions,
        message: `Session marked! ${totalSessions - (sessionsUsed + 1)} sessions remaining.`,
        businessName: businessData.name,
        membershipCost: customerCard.cost || 15000
      }

      // Add completion message if all sessions used
      if ((sessionsUsed + 1) >= totalSessions) {
        result.message = 'All sessions used! Your membership is complete.'
        result.completionReward = 'Membership benefits fully utilized'
      }

    } else if (!isMembership && actualUsageType === 'stamp') {
      // Handle loyalty card stamp addition
      const currentStamps = customerCard.current_stamps || 0
      const totalStamps = stampCardData.total_stamps || 10

      // Check if already completed
      if (currentStamps >= totalStamps) {
        return NextResponse.json({
          success: false,
          error: 'Loyalty card already completed',
          currentStamps,
          totalStamps,
          stampsRemaining: 0,
          rewardReady: true
        })
      }

      // Record stamp usage
      const { error: sessionError } = await supabase
        .from('session_usage')
        .insert({
          customer_card_id: customerCardId,
          business_id: businessData.id,
          marked_by: null, // QR scan doesn't have a specific user
          usage_type: 'stamp',
          notes: notes || `QR scan stamp collection at ${businessData.name}`
        })

      if (sessionError) {
        console.error('Error recording stamp usage:', sessionError)
        return NextResponse.json({
          success: false,
          error: 'Failed to record stamp usage'
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
        console.error('Error updating stamps:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update stamp count'
        }, { status: 500 })
      }

      result = {
        success: true,
        action: 'stamp_added',
        cardType: 'loyalty',
        currentStamps: currentStamps + 1,
        totalStamps,
        stampsRemaining: totalStamps - (currentStamps + 1),
        isCompleted: (currentStamps + 1) >= totalStamps,
        message: `Stamp added! ${totalStamps - (currentStamps + 1)} more stamps needed for your reward.`,
        businessName: businessData.name,
        rewardDescription: stampCardData.reward_description
      }

      // Add completion message if reward unlocked
      if ((currentStamps + 1) >= totalStamps) {
        result.message = 'Congratulations! Your reward is ready to claim.'
        result.rewardReady = true
      }

    } else {
      return NextResponse.json({
        success: false,
        error: `Invalid usage type '${actualUsageType}' for ${isMembership ? 'membership' : 'loyalty'} card`
      }, { status: 400 })
    }

    // Queue wallet updates for real-time synchronization
    try {
      const { error: queueError } = await supabase
        .from('wallet_update_queue')
        .insert({
          customer_card_id: customerCardId,
          update_type: isMembership ? 'session_update' : 'stamp_update',
          metadata: {
            action: result.action,
            timestamp: new Date().toISOString(),
            businessId: businessData.id,
            businessName: businessData.name,
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
        console.warn('Warning: Failed to queue wallet update:', queueError)
        // Don't fail the main request for this
      } else {
        console.log('✅ Wallet update queued for real-time synchronization')
        result.walletUpdateQueued = true
      }
    } catch (queueError) {
      console.warn('Warning: Error queuing wallet update:', queueError)
      // Continue without failing
    }

    console.log('✅ QR scan processed successfully:', result)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('Error processing mark-session request:', error)
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

// Get session usage history for a customer card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    
    if (!validateUUID(customerCardId)) {
      return NextResponse.json(
        { error: 'Invalid customer card ID format' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerClient()
    
    // Get session usage history
    const { data: sessions, error } = await supabase
      .from('session_usage')
      .select(`
        id,
        usage_type,
        session_date,
        notes,
        created_at,
        businesses (
          id,
          name
        )
      `)
      .eq('customer_card_id', customerCardId)
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (error) {
      console.error('Error fetching session history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch session history' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      customer_card_id: customerCardId,
      sessions: sessions || [],
      total_sessions: sessions?.length || 0
    })
    
  } catch (error) {
    console.error('Error in session history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 