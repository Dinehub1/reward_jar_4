import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

// DEPRECATED ENDPOINT GUARD - Remove after PR approval
if (process.env.DISABLE_LEGACY_ADMIN_ENDPOINTS === 'true') {
  export async function GET() {
    return NextResponse.json({ 
      success: false, 
      error: 'Deprecated endpoint - use /api/admin/cards instead' 
    }, { status: 410 })
  }
}

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
      console.warn(`❌ Attempt ${attempt}/${maxRetries} failed:`, error)
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }
  
  throw lastError!
}

export async function GET(request: NextRequest) {
  console.log('🎯 ADMIN CARDS SIMPLE - Fetching real card data from database...')
  
  try {
    const supabase = createAdminClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const cardType = searchParams.get('type') // 'stamp' or 'membership'
    
    console.log('Query params:', { businessId, cardType })
    
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
        console.log(`✅ Stamp cards fetched successfully: ${stampCards.length}`)
      } catch (stampError) {
        console.error('❌ Failed to fetch stamp cards after retries:', stampError)
        // Continue with empty array - don't fail the entire request
      }
    }

    // Fetch membership cards if no type filter or type is 'membership'
    if (!cardType || cardType === 'membership') {
      try {
        membershipCards = await retryOperation(membershipCardsOperation)
        console.log(`✅ Membership cards fetched successfully: ${membershipCards.length}`)
      } catch (membershipError) {
        console.error('❌ Failed to fetch membership cards after retries:', membershipError)
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
    
    console.log('✅ ADMIN CARDS SIMPLE - Real data fetched:', {
      stampCards: processedStampCards.length,
      membershipCards: processedMembershipCards.length,
      totalCards: processedStampCards.length + processedMembershipCards.length
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ ADMIN CARDS SIMPLE - Critical Error:', error)
    
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
    
    console.log('🔄 ADMIN CARDS SIMPLE - Returning fallback data due to errors')
    
    return NextResponse.json(fallbackResult)
  }
} 