import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface AddStampRequest {
  customerCardId: string
  businessId?: string
  markedBy?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  console.log('🎯 STAMP/SESSION ADD - Processing request...')
  
  try {
    const body = await request.json() as AddStampRequest
    const { customerCardId, businessId, markedBy, notes } = body

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
      console.error('❌ Customer card not found:', customerCardId)
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    // Determine card type using unified schema
    const isStampCard = customerCard.stamp_card_id !== null
    const isMembershipCard = customerCard.membership_card_id !== null

    if (!isStampCard && !isMembershipCard) {
      console.error('❌ Invalid card type - neither stamp nor membership card')
      return NextResponse.json(
        { error: 'Invalid card type' },
        { status: 400 }
      )
    }

    console.log(`📝 Processing ${isStampCard ? 'stamp' : 'session'} addition for card ${customerCardId}`)

    let updateResult
    let updateType: 'stamp_update' | 'session_update' | 'reward_complete' = isStampCard ? 'stamp_update' : 'session_update'
    
    if (isStampCard) {
      // Handle stamp card logic
      const stampCard = customerCard.stamp_cards!
      const currentStamps = customerCard.current_stamps
      const totalStamps = stampCard.total_stamps
      
      if (currentStamps >= totalStamps) {
        return NextResponse.json(
          { error: 'Card is already complete' },
          { status: 400 }
        )
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
        console.error('❌ Error updating stamp count:', updateError)
        return NextResponse.json(
          { error: 'Failed to update stamp count' },
          { status: 500 }
        )
      }

      // Log session usage
      await supabase
        .from('session_usage')
        .insert([{
          customer_card_id: customerCardId,
          business_id: businessId || stampCard.business_id,
          marked_by: markedBy,
          usage_type: 'stamp',
          notes: notes
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

      console.log(`✅ Stamp added: ${newStampCount}/${totalStamps} ${isComplete ? '(COMPLETE!)' : ''}`)

    } else {
      // Handle membership card logic
      const membershipCard = customerCard.membership_cards!
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
        console.error('❌ Error updating session count:', updateError)
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

      console.log(`✅ Session marked: ${newSessionCount}/${totalSessions} (${sessionsRemaining} remaining)`)
    }

    // Add to wallet update queue for real-time wallet updates
    const queueMetadata = {
      customer_name: customerCard.customers.name,
      business_name: isStampCard 
        ? customerCard.stamp_cards!.businesses.name 
        : customerCard.membership_cards!.businesses.name,
      card_name: isStampCard 
        ? customerCard.stamp_cards!.name 
        : customerCard.membership_cards!.name,
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
      console.error('⚠️ Warning: Failed to add to wallet update queue:', queueError)
      // Don't fail the request if queue update fails
    } else {
      console.log(`📤 Added ${updateType} to wallet update queue`)
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
        console.error('⚠️ Warning: Failed to trigger wallet queue processing:', error)
      })
    }

    return NextResponse.json({
      success: true,
      data: updateResult,
      wallet_update_queued: !queueError
    })

  } catch (error) {
    console.error('❌ STAMP/SESSION ADD ERROR:', error)
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
      const stampCard = customerCard.stamp_cards!
      cardStatus = {
        card_type: 'stamp',
        current_stamps: customerCard.current_stamps,
        total_stamps: stampCard.total_stamps,
        progress_percentage: Math.round((customerCard.current_stamps / stampCard.total_stamps) * 100),
        is_complete: customerCard.current_stamps >= stampCard.total_stamps,
        card_name: stampCard.name,
        reward_description: stampCard.reward_description
      }
    } else {
      const membershipCard = customerCard.membership_cards!
      const isExpired = customerCard.expiry_date && new Date(customerCard.expiry_date) < new Date()
      cardStatus = {
        card_type: 'membership',
        sessions_used: customerCard.sessions_used,
        total_sessions: membershipCard.total_sessions,
        sessions_remaining: membershipCard.total_sessions - customerCard.sessions_used,
        progress_percentage: Math.round((customerCard.sessions_used / membershipCard.total_sessions) * 100),
        is_expired: isExpired,
        expiry_date: customerCard.expiry_date,
        card_name: membershipCard.name,
        cost: membershipCard.cost
      }
    }

    return NextResponse.json({
      success: true,
      card_status: cardStatus
    })

  } catch (error) {
    console.error('Error fetching card status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 