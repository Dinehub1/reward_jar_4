import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schema
const addStampSchema = z.object({
  customerCardId: z.string().uuid('Invalid customer card ID'),
  locationId: z.string().optional(), // Optional location tracking
  businessConfirmation: z.boolean().optional() // For business-initiated stamps
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = addStampSchema.parse(body)
    
    const { customerCardId } = validatedData

    // Get customer card with stamp card details
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        customer_id,
        stamp_card_id,
        current_stamps,
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

    const stampCard = customerCard.stamp_cards as any
    const business = stampCard.businesses as any

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