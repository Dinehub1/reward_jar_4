import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser, getServerSession } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, cardId } = body

    // Validate input
    if (!name?.trim() || !email?.trim() || !cardId) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, and card ID are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid email address'
      }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Check if stamp card exists
    const { data: stampCard, error: cardError } = await supabase
      .from('stamp_cards')
      .select('id, name, business_id')
      .eq('id', cardId)
      .eq('status', 'active')
      .single()

    if (cardError || !stampCard) {
      return NextResponse.json({
        success: false,
        error: 'Stamp card not found or is no longer active'
      }, { status: 404 })
    }

    // For now, we'll just validate the data and return success
    // The actual account creation will happen when they go through the signup flow
    return NextResponse.json({
      success: true,
      message: 'Information received successfully',
      data: {
        name: name.trim(),
        email: email.trim(),
        cardId: cardId,
        cardName: stampCard.name
      }
    })

  } catch (error) {
    console.error('Guest signup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
} 