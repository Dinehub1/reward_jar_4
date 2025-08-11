import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser, getServerSession } from '@/lib/supabase/server'
import { checkCooldown, getCooldownConfig } from '@/lib/utils/cooldown'
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
    const { businessId, usageType = 'auto', notes = null, billAmount, override = false } = body as { businessId?: string, usageType?: string, notes?: string | null, billAmount?: number, override?: boolean }

      customerCardId,
      businessId,
      usageType,
      notes
    })
    
    const supabase = await createServerClient()
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Role check for actions: require role_id 2 (business) normally; allow role_id 1 (admin) only if override=true
    const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
    const { data: userRow } = await adminClient.from('users').select('role_id').eq('id', user.id).single()
    const roleId = userRow?.role_id ?? 0
    const isAdmin = roleId === 1
    const isBusiness = roleId === 2
    if (!(isBusiness || (isAdmin && override === true))) {
      return NextResponse.json({ success: false, error: 'Insufficient role for action' }, { status: 403 })
    }
    
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

    // Check cooldown to prevent rapid repeat actions
    const cooldownConfig = getCooldownConfig(actualUsageType as 'session' | 'stamp')
    const cooldownResult = await checkCooldown(customerCardId, cooldownConfig)
    
    if (!cooldownResult.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: cooldownResult.error,
        cooldownMinutes: cooldownResult.cooldownMinutes,
        lastUsageAt: cooldownResult.lastUsageAt
      }, { status: 429 })
    }

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
          marked_by: user.id,
          usage_type: 'session',
          notes: notes || `QR scan session marking at ${businessData.name}`
        })

      if (sessionError) {
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

      // Emit card_events: session_marked
      try {
        const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
        await adminClient.from('card_events').insert({
          card_id: customerCardId,
          event_type: 'session_marked',
          metadata: { business_id: businessData.id, method: 'qr', notes, staff_id: user.id, override: isAdmin && override === true }
        })
      } catch (e) {
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
          marked_by: user.id,
          usage_type: 'stamp',
          notes: notes || `QR scan stamp collection at ${businessData.name}`
        })

      if (sessionError) {
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

      // Emit card_events: stamp_given (+ optional purchase when billAmount provided)
      try {
        const adminClient = await (await import('@/lib/supabase/admin-client')).createAdminClient()
        await adminClient.from('card_events').insert({
          card_id: customerCardId,
          event_type: 'stamp_given',
          metadata: { business_id: businessData.id, method: 'qr', notes, staff_id: user.id }
        })
        if (typeof billAmount === 'number' && !Number.isNaN(billAmount) && billAmount > 0) {
          await adminClient.from('card_events').insert({
            card_id: customerCardId,
            event_type: 'purchase',
            metadata: { business_id: businessData.id, amount_cents: Math.round(billAmount * 100), staff_id: user.id, override: isAdmin && override === true }
          })
        }
      } catch (e) {
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
        // Don't fail the main request for this
      } else {
        result.walletUpdateQueued = true
      }
    } catch (queueError) {
      // Continue without failing
    }

    // Trigger admin dashboard cache invalidation for real-time updates
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/dashboard-unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isMembership ? 'session_marked' : 'stamp_added',
          table: 'customer_cards',
          recordId: customerCardId,
          businessId: businessData.id,
          metadata: result
        })
      })
    } catch (cacheError) {
      // Don't fail the main request for cache issues
    }


    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Admin-Cache-Invalidated': 'true'
      }
    })
    
  } catch (error) {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 