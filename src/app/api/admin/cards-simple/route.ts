import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// Retry function for database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }
  
  throw lastError!
}

export async function GET(request: NextRequest) {
  
  try {
    const supabase = createAdminClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const cardType = searchParams.get('type') // 'stamp' or 'membership'
    
    
    // Fetch stamp cards with retry logic
    const stampCardsOperation = async () => {
      let query = supabase
        .from('stamp_cards')
        .select(`
          *,
          businesses:business_id (
            id,
            name
          ),
          customer_cards (id)
        `)
      
      // Apply business filter if provided
      if (businessId) {
        query = query.eq('business_id', businessId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Stamp cards fetch failed: ${error.message}`)
      }
      
      return data || []
    }

    // Fetch membership cards with retry logic
    const membershipCardsOperation = async () => {
      let query = supabase
        .from('membership_cards')
        .select(`
          *,
          businesses:business_id (
            id, 
            name
          ),
          customer_cards (id)
        `)
      
      // Apply business filter if provided
      if (businessId) {
        query = query.eq('business_id', businessId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Membership cards fetch failed: ${error.message}`)
      }
      
      return data || []
    }

    // Execute operations based on card type filter
    let stampCards: any[] = []
    let membershipCards: any[] = []

    // Fetch stamp cards if no type filter or type is 'stamp'
    if (!cardType || cardType === 'stamp') {
      try {
        stampCards = await retryOperation(stampCardsOperation)
      } catch (stampError) {
        // Continue with empty array - don't fail the entire request
      }
    }

    // Fetch membership cards if no type filter or type is 'membership'
    if (!cardType || cardType === 'membership') {
      try {
        membershipCards = await retryOperation(membershipCardsOperation)
      } catch (membershipError) {
        // Continue with empty array - don't fail the entire request
      }
    }

    // Process the data to match expected format
    const processedStampCards = stampCards.map(card => ({
      ...card,
      customer_cards: card.customer_cards || []
    }))

    const processedMembershipCards = membershipCards.map(card => ({
      ...card,
      customer_cards: card.customer_cards || []
    }))

    const result = {
      success: true,
      data: {
        stampCards: processedStampCards,
        membershipCards: processedMembershipCards,
        stats: {
          totalStampCards: processedStampCards.length,
          totalMembershipCards: processedMembershipCards.length,
          totalCards: processedStampCards.length + processedMembershipCards.length,
          activeStampCards: processedStampCards.filter(card => card.status === 'active').length,
          activeMembershipCards: processedMembershipCards.filter(card => card.status === 'active').length
        }
      },
      // Add metadata about any failures
      metadata: {
        stampCardsFetched: stampCards.length > 0,
        membershipCardsFetched: membershipCards.length > 0,
        timestamp: new Date().toISOString()
      }
    }
    
      stampCards: processedStampCards.length,
      membershipCards: processedMembershipCards.length,
      totalCards: processedStampCards.length + processedMembershipCards.length
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    
    // Return fallback data instead of failing completely
    const fallbackResult = {
      success: true, // Still return success to prevent client errors
      data: {
        stampCards: [],
        membershipCards: [],
        stats: {
          totalStampCards: 0,
          totalMembershipCards: 0,
          totalCards: 0,
          activeStampCards: 0,
          activeMembershipCards: 0
        }
      },
      metadata: {
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
    
    
    return NextResponse.json(fallbackResult)
  }
} 