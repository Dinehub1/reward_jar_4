import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import validateUUID from 'uuid-validate'

// Mark session or stamp usage via QR scan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    const { businessId, usageType = 'session', notes } = await request.json()
    
    // Validate UUID format
    if (!validateUUID(customerCardId)) {
      return NextResponse.json(
        { error: 'Invalid customer card ID format' },
        { status: 400 }
      )
    }
    
    if (!validateUUID(businessId)) {
      return NextResponse.json(
        { error: 'Invalid business ID format' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Validate business ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('owner_id', user.id)
      .single()
      
    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or unauthorized' },
        { status: 403 }
      )
    }
    
    // Get customer card details
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        membership_type,
        sessions_used,
        total_sessions,
        current_stamps,
        cost,
        expiry_date,
        wallet_type,
        stamp_cards!inner (
          id,
          total_stamps,
          name,
          reward_description
        ),
        customers!inner (
          id,
          name,
          email
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
    
    // Handle the data structure properly - stamp_cards and customers are arrays from Supabase joins
    const stampCardData = Array.isArray(customerCard.stamp_cards) && customerCard.stamp_cards.length > 0 
      ? customerCard.stamp_cards[0] as {
          id: string
          total_stamps: number
          name: string
          reward_description: string
        }
      : null

    const customerData = Array.isArray(customerCard.customers) && customerCard.customers.length > 0
      ? customerCard.customers[0] as {
          id: string
          name: string
          email: string
        }
      : null

    if (!stampCardData || !customerData) {
      return NextResponse.json(
        { error: 'Card or customer data not found' },
        { status: 404 }
      )
    }
    
    // Validate usage type against card type
    if (customerCard.membership_type === 'gym' && usageType !== 'session') {
      return NextResponse.json(
        { error: 'Gym memberships only support session marking' },
        { status: 400 }
      )
    }
    
    if (customerCard.membership_type === 'loyalty' && usageType !== 'stamp') {
      return NextResponse.json(
        { error: 'Loyalty cards only support stamp marking' },
        { status: 400 }
      )
    }
    
    // Validate membership-specific constraints
    if (customerCard.membership_type === 'gym') {
      // Check sessions remaining
      if (customerCard.sessions_used >= (customerCard.total_sessions || 0)) {
        return NextResponse.json(
          { 
            error: 'No sessions remaining',
            sessions_used: customerCard.sessions_used,
            total_sessions: customerCard.total_sessions
          },
          { status: 400 }
        )
      }
      
      // Check expiry
      if (customerCard.expiry_date && new Date(customerCard.expiry_date) < new Date()) {
        return NextResponse.json(
          { 
            error: 'Membership expired',
            expiry_date: customerCard.expiry_date
          },
          { status: 400 }
        )
      }
    }
    
    // Use the database function to mark usage
    const { data: result, error: markError } = await supabase
      .rpc('mark_session_usage', {
        p_customer_card_id: customerCardId,
        p_business_id: businessId,
        p_marked_by: user.id,
        p_usage_type: usageType,
        p_notes: notes || null
      })
      
    if (markError) {
      console.error('Error marking session/stamp:', markError)
      return NextResponse.json(
        { error: 'Failed to mark session/stamp', details: markError.message },
        { status: 500 }
      )
    }
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // Get updated customer card data
    const { data: updatedCard, error: updateError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        membership_type,
        sessions_used,
        total_sessions,
        current_stamps,
        cost,
        expiry_date,
        wallet_type,
        stamp_cards (
          id,
          total_stamps,
          name,
          reward_description
        )
      `)
      .eq('id', customerCardId)
      .single()
      
    if (updateError) {
      console.error('Error fetching updated card:', updateError)
    }
    
    // Calculate progress and status
    let progress = 0
    let isCompleted = false
    let remaining = 0
    
    if (customerCard.membership_type === 'gym') {
      progress = ((updatedCard?.sessions_used || result.sessions_used) / (updatedCard?.total_sessions || 20)) * 100
      remaining = (updatedCard?.total_sessions || 20) - (updatedCard?.sessions_used || result.sessions_used)
      isCompleted = remaining <= 0
    } else {
      const totalStamps = stampCardData.total_stamps || 10
      const currentStamps = updatedCard?.current_stamps || result.current_stamps
      progress = (currentStamps / totalStamps) * 100
      remaining = totalStamps - currentStamps
      isCompleted = remaining <= 0
    }
    
    // Trigger immediate wallet updates (will be processed by background job)
    console.log(`✅ ${usageType} marked successfully for card ${customerCardId}`)
    console.log(`📊 Progress: ${Math.round(progress)}%, Remaining: ${remaining}`)
    
    const response = {
      success: true,
      marked_at: new Date().toISOString(),
      usage_type: usageType,
      business: {
        id: business.id,
        name: business.name
      },
      customer: {
        id: customerData.id,
        name: customerData.name
      },
      card: {
        id: customerCardId,
        membership_type: customerCard.membership_type,
        wallet_type: customerCard.wallet_type,
        progress: Math.round(progress),
        is_completed: isCompleted,
        remaining: remaining
      },
      result: usageType === 'session' ? {
        sessions_used: result.sessions_used,
        sessions_remaining: result.sessions_remaining,
        total_sessions: updatedCard?.total_sessions || customerCard.total_sessions
      } : {
        current_stamps: result.current_stamps,
        stamps_remaining: remaining,
        total_stamps: stampCardData.total_stamps
      },
      notes: notes || null
    }
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('Error in mark-session API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    
    const supabase = await createClient()
    
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