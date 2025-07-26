import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const addStampSchema = z.object({
  customerCardId: z.string().uuid('Invalid customer card ID'),
  locationId: z.string().optional(), // Optional location tracking
  businessConfirmation: z.boolean().optional(), // For business-initiated stamps
  usageType: z.enum(['stamp', 'session']).optional() // Auto-detected if not provided
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = addStampSchema.parse(body)
    
    const { customerCardId, usageType } = validatedData

    // Get customer card with full details including membership info
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        customer_id,
        stamp_card_id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        stamp_cards!inner (
          id,
          total_stamps,
          name,
          reward_description,
          business_id,
          businesses!inner (
            name
          )
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

    const stampCardData = (customerCard.stamp_cards as unknown) as {
      id: string
      total_stamps: number
      name: string
      reward_description: string
      business_id: string
      businesses: {
        name: string
      }
    }
    const businessData = stampCardData?.businesses as {
      name: string
    }
    
    const stampCard = {
      id: stampCardData.id,
      total_stamps: stampCardData.total_stamps || 10,
      name: stampCardData.name || 'Loyalty Card',
      reward_description: stampCardData.reward_description || 'Reward',
      business_id: stampCardData.business_id
    }
    
    const business = {
      name: businessData?.name || 'Business'
    }

    // Determine usage type based on card type if not provided
    const actualUsageType = usageType || (customerCard.membership_type === 'gym' ? 'session' : 'stamp')

    // Validate usage type against card type
    if (customerCard.membership_type === 'gym' && actualUsageType !== 'session') {
      return NextResponse.json(
        { error: 'Gym memberships only support session marking' },
        { status: 400 }
      )
    }

    if (customerCard.membership_type === 'loyalty' && actualUsageType !== 'stamp') {
      return NextResponse.json(
        { error: 'Loyalty cards only support stamp addition' },
        { status: 400 }
      )
    }

    // Handle membership cards (gym sessions)
    if (customerCard.membership_type === 'gym') {
      // Check if membership is expired
      if (customerCard.expiry_date && new Date(customerCard.expiry_date) < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Membership expired',
          membershipCard: {
            id: customerCard.id,
            sessionsUsed: customerCard.sessions_used || 0,
            totalSessions: customerCard.total_sessions || 20,
            expiryDate: customerCard.expiry_date,
            isExpired: true,
            card: {
              name: stampCard.name,
              business: business
            }
          }
        }, { status: 400 })
      }

      // Check if all sessions are used
      const currentSessionsUsed = customerCard.sessions_used || 0
      const totalSessions = customerCard.total_sessions || 20

      if (currentSessionsUsed >= totalSessions) {
        return NextResponse.json({
          success: true,
          message: 'All sessions have been used! Please renew your membership.',
          membershipCard: {
            id: customerCard.id,
            sessionsUsed: currentSessionsUsed,
            totalSessions: totalSessions,
            isCompleted: true,
            cost: customerCard.cost,
            expiryDate: customerCard.expiry_date,
            card: {
              name: stampCard.name,
              business: business
            }
          }
        })
      }

      // Use the database function to mark session usage
      const { data: result, error: markError } = await supabase
        .rpc('mark_session_usage', {
          p_customer_card_id: customerCardId,
          p_business_id: stampCard.business_id,
          p_marked_by: null, // Can be set if business user is marking
          p_usage_type: 'session',
          p_notes: 'Session marked via stamp/add API'
        })

      if (markError || !result?.success) {
        console.error('Error marking session:', markError)
        return NextResponse.json(
          { error: result?.error || 'Failed to mark session' },
          { status: 500 }
        )
      }

      const newSessionsUsed = result.sessions_used
      const sessionsRemaining = (result.sessions_remaining || (totalSessions - newSessionsUsed))
      const isCompleted = newSessionsUsed >= totalSessions

      return NextResponse.json({
        success: true,
        message: isCompleted 
          ? '🎉 All sessions used! Your membership is complete.' 
          : `Session marked! ${sessionsRemaining} sessions remaining.`,
        membershipCard: {
          id: customerCard.id,
          sessionsUsed: newSessionsUsed,
          totalSessions: totalSessions,
          sessionsRemaining,
          isCompleted,
          isExpired: false,
          cost: customerCard.cost,
          expiryDate: customerCard.expiry_date,
          card: {
            name: stampCard.name,
            business: business
          }
        }
      })
    }

    // Handle loyalty cards (stamp collection) - existing logic
    else {
      // Check if card is already completed
      if (customerCard.current_stamps >= stampCard.total_stamps) {
        return NextResponse.json({
          success: true,
          message: 'Card already completed! Reward is ready to claim.',
          customerCard: {
            id: customerCard.id,
            currentStamps: customerCard.current_stamps,
            totalStamps: stampCard.total_stamps,
            isCompleted: true,
            stampCard: {
              name: stampCard.name,
              rewardDescription: stampCard.reward_description
            },
            business: {
              name: business.name
            }
          }
        })
      }

      // Add stamp to individual stamps table
      const { error: stampInsertError } = await supabase
        .from('stamps')
        .insert({
          customer_id: customerCard.customer_id,
          stamp_card_id: customerCard.stamp_card_id,
          // location_id: locationId // Add if location tracking is implemented
        })

      if (stampInsertError) {
        console.error('Error inserting stamp:', stampInsertError)
        return NextResponse.json(
          { error: 'Failed to add stamp' },
          { status: 500 }
        )
      }

      // Update customer card stamp count
      const newStampCount = customerCard.current_stamps + 1
      const { error: updateError } = await supabase
        .from('customer_cards')
        .update({ current_stamps: newStampCount })
        .eq('id', customerCardId)

      if (updateError) {
        console.error('Error updating customer card:', updateError)
        return NextResponse.json(
          { error: 'Failed to update stamp count' },
          { status: 500 }
        )
      }

      // Check if reward is now unlocked
      const isCompleted = newStampCount >= stampCard.total_stamps
      let rewardGenerated = false

      if (isCompleted) {
        // Create reward record
        const { error: rewardError } = await supabase
          .from('rewards')
          .insert({
            customer_id: customerCard.customer_id,
            stamp_card_id: customerCard.stamp_card_id,
            created_at: new Date().toISOString()
          })

        if (rewardError) {
          console.error('Error creating reward:', rewardError)
          // Continue - stamp was added successfully even if reward creation failed
        } else {
          rewardGenerated = true
        }
      }

      const stampsRemaining = Math.max(stampCard.total_stamps - newStampCount, 0)

      return NextResponse.json({
        success: true,
        message: isCompleted 
          ? '🎉 Congratulations! Your reward is ready to claim!' 
          : `Stamp added! ${stampsRemaining} more stamps needed for your reward.`,
        customerCard: {
          id: customerCard.id,
          currentStamps: newStampCount,
          totalStamps: stampCard.total_stamps,
          isCompleted,
          stampsRemaining,
          rewardGenerated,
          stampCard: {
            name: stampCard.name,
            rewardDescription: stampCard.reward_description
          },
          business: {
            name: business.name
          }
        }
      })
    }

  } catch (error) {
    console.error('Error in add stamp API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 