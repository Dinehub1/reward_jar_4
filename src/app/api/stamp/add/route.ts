import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface AddStampRequest {
  customerCardId: string
  businessId?: string
  markedBy?: string
  notes?: string
  billAmount?: number
}

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json() as AddStampRequest
    const { customerCardId, businessId, markedBy, notes, billAmount } = body

    if (!customerCardId) {
      return NextResponse.json(
        { error: 'Customer card ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get customer card with full details
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        customer_id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        expiry_date,
        wallet_type,
        wallet_pass_id,
        customers!inner(name, email),
        stamp_cards(
          id,
          name,
          total_stamps,
          reward_description,
          business_id,
          stamp_condition,
          min_bill_amount,
          businesses!inner(id, name)
        ),
        membership_cards(
          id,
          name,
          total_sessions,
          cost,
          business_id,
          businesses!inner(id, name)
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (cardError || !customerCard) {
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    // Determine card type using unified schema
    const isStampCard = customerCard.stamp_card_id !== null
    const isMembershipCard = customerCard.membership_card_id !== null

    if (!isStampCard && !isMembershipCard) {
      return NextResponse.json(
        { error: 'Invalid card type' },
        { status: 400 }
      )
    }


    let updateResult
    let updateType: 'stamp_update' | 'session_update' | 'reward_complete' = isStampCard ? 'stamp_update' : 'session_update'
    
    if (isStampCard) {
      // Handle stamp card logic
      const stampCard = customerCard.stamp_cards![0]
      if (!stampCard) {
        return NextResponse.json(
          { error: 'Stamp card data not found' },
          { status: 500 }
        )
      }
      const currentStamps = customerCard.current_stamps
      const totalStamps = stampCard.total_stamps
      
      if (currentStamps >= totalStamps) {
        return NextResponse.json(
          { error: 'Card is already complete' },
          { status: 400 }
        )
      }

      // Check stamp condition - validate bill amount if required
      if (stampCard.stamp_condition === 'min_bill_amount') {
        if (!billAmount) {
          return NextResponse.json(
            { error: 'Bill amount is required for this card' },
            { status: 400 }
          )
        }
        
        if (billAmount < (stampCard.min_bill_amount || 0)) {
          return NextResponse.json(
            { 
              error: `Minimum bill amount required: $${stampCard.min_bill_amount}`,
              required_amount: stampCard.min_bill_amount,
              provided_amount: billAmount
            },
            { status: 400 }
          )
        }
      }

      const newStampCount = currentStamps + 1
      const isComplete = newStampCount >= totalStamps

      // Update stamp count
      const { error: updateError } = await supabase
        .from('customer_cards')
        .update({ 
          current_stamps: newStampCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerCardId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update stamp count' },
          { status: 500 }
        )
      }

      // Log session usage with bill amount
      await supabase
        .from('session_usage')
        .insert([{
          customer_card_id: customerCardId,
          business_id: businessId || stampCard.business_id,
          marked_by: markedBy,
          usage_type: 'stamp',
          notes: notes,
          bill_amount: billAmount
        }])

      updateType = isComplete ? 'reward_complete' : 'stamp_update'
      updateResult = {
        success: true,
        card_type: 'stamp',
        current_stamps: newStampCount,
        total_stamps: totalStamps,
        is_complete: isComplete,
        progress_percentage: Math.round((newStampCount / totalStamps) * 100),
        message: isComplete 
          ? `🎉 Congratulations! You've completed your ${stampCard.name} card!`
          : `Stamp added! ${newStampCount}/${totalStamps} stamps collected.`
      }


      // Emit card_events: stamp_given; optionally purchase when billAmount provided
      try {
        await supabase.from('card_events').insert({
          card_id: customerCardId,
          event_type: 'stamp_given',
          metadata: { business_id: businessId || stampCard.business_id, marked_by: markedBy, notes, amount_cents: billAmount ? Math.round(billAmount * 100) : undefined }
        })
        if (billAmount) {
          await supabase.from('card_events').insert({
            card_id: customerCardId,
            event_type: 'purchase',
            metadata: { business_id: businessId || stampCard.business_id, amount_cents: Math.round(billAmount * 100) }
          })
        }
        if (isComplete) {
          await supabase.from('card_events').insert({
            card_id: customerCardId,
            event_type: 'reward_redeemed',
            metadata: { business_id: businessId || stampCard.business_id, reward_value_cents: 0 }
          })
        }
      } catch (e) {
      }

    } else {
      // Handle membership card logic
      const membershipCard = customerCard.membership_cards![0]
      if (!membershipCard) {
        return NextResponse.json(
          { error: 'Membership card data not found' },
          { status: 500 }
        )
      }
      const sessionsUsed = customerCard.sessions_used
      const totalSessions = membershipCard.total_sessions
      
      // Check if membership is expired
      if (customerCard.expiry_date && new Date(customerCard.expiry_date) < new Date()) {
        return NextResponse.json(
          { error: 'Membership has expired' },
          { status: 400 }
        )
      }

      if (sessionsUsed >= totalSessions) {
        return NextResponse.json(
          { error: 'No sessions remaining' },
          { status: 400 }
        )
      }

      const newSessionCount = sessionsUsed + 1
      const sessionsRemaining = totalSessions - newSessionCount

      // Update session count
      const { error: updateError } = await supabase
        .from('customer_cards')
        .update({ 
          sessions_used: newSessionCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerCardId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update session count' },
          { status: 500 }
        )
      }

      // Log session usage
      await supabase
        .from('session_usage')
        .insert([{
          customer_card_id: customerCardId,
          business_id: businessId || membershipCard.business_id,
          marked_by: markedBy,
          usage_type: 'session',
          notes: notes
        }])

      updateResult = {
        success: true,
        card_type: 'membership',
        sessions_used: newSessionCount,
        total_sessions: totalSessions,
        sessions_remaining: sessionsRemaining,
        progress_percentage: Math.round((newSessionCount / totalSessions) * 100),
        expiry_date: customerCard.expiry_date,
        message: `Session marked! ${sessionsRemaining} sessions remaining.`
      }


      // Emit card_events: session_marked
      try {
        await supabase.from('card_events').insert({
          card_id: customerCardId,
          event_type: 'session_marked',
          metadata: { business_id: businessId || membershipCard.business_id, marked_by: markedBy, notes }
        })
      } catch (e) {
      }
    }

    // Add to wallet update queue for real-time wallet updates
    const queueMetadata = {
      customer_name: customerCard.customers[0]?.name || 'Unknown Customer',
      business_name: isStampCard 
        ? customerCard.stamp_cards![0]?.businesses[0]?.name || 'Unknown Business'
        : customerCard.membership_cards![0]?.businesses[0]?.name || 'Unknown Business',
      card_name: isStampCard 
        ? customerCard.stamp_cards![0]?.name || 'Unknown Card'
        : customerCard.membership_cards![0]?.name || 'Unknown Card',
      previous_progress: isStampCard 
        ? customerCard.current_stamps 
        : customerCard.sessions_used,
      new_progress: isStampCard 
        ? updateResult.current_stamps 
        : updateResult.sessions_used,
      wallet_type: customerCard.wallet_type,
      timestamp: new Date().toISOString()
    }

    const { error: queueError } = await supabase
      .from('wallet_update_queue')
      .insert([{
        customer_card_id: customerCardId,
        update_type: updateType,
        metadata: queueMetadata
      }])

    if (queueError) {
      // Don't fail the request if queue update fails
    } else {
    }

    // Trigger wallet queue processing (fire and forget)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/wallet/process-updates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_DEBUG_TOKEN || 'admin-debug-token'}`,
          'Content-Type': 'application/json'
        }
      }).catch(error => {
      })
    }

    return NextResponse.json({
      success: true,
      data: updateResult,
      wallet_update_queued: !queueError
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check stamp/session addition status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerCardId = searchParams.get('customerCardId')

    if (!customerCardId) {
      return NextResponse.json(
        { error: 'Customer card ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get current card status
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        expiry_date,
        stamp_cards(name, total_stamps, reward_description),
        membership_cards(name, total_sessions, cost)
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    const isStampCard = customerCard.stamp_card_id !== null
    
    let cardStatus
    if (isStampCard) {
      const stampCard = customerCard.stamp_cards![0]
      cardStatus = {
        card_type: 'stamp',
        current_stamps: customerCard.current_stamps,
        total_stamps: stampCard?.total_stamps || 0,
        progress_percentage: Math.round((customerCard.current_stamps / (stampCard?.total_stamps || 1)) * 100),
        is_complete: customerCard.current_stamps >= (stampCard?.total_stamps || 0),
        card_name: stampCard?.name || 'Unknown Card',
        reward_description: stampCard?.reward_description || ''
      }
    } else {
      const membershipCard = customerCard.membership_cards![0]
      const isExpired = customerCard.expiry_date && new Date(customerCard.expiry_date) < new Date()
      cardStatus = {
        card_type: 'membership',
        sessions_used: customerCard.sessions_used,
        total_sessions: membershipCard?.total_sessions || 0,
        sessions_remaining: (membershipCard?.total_sessions || 0) - customerCard.sessions_used,
        progress_percentage: Math.round((customerCard.sessions_used / (membershipCard?.total_sessions || 1)) * 100),
        is_expired: isExpired,
        expiry_date: customerCard.expiry_date,
        card_name: membershipCard?.name || 'Unknown Card',
        cost: membershipCard?.cost || 0
      }
    }

    return NextResponse.json({
      success: true,
      card_status: cardStatus
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 