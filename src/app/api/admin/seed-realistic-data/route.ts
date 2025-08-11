import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  
  try {
    const supabase = createAdminClient()
    
    // 1. Get existing businesses to assign customers to
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .limit(10)
    
    if (businessError || !businesses) {
      throw new Error(`Failed to fetch businesses: ${businessError?.message}`)
    }
    
    
    // 2. Get existing stamp and membership cards
    const { data: stampCards, error: stampError } = await supabase
      .from('stamp_cards')
      .select('id, name, business_id, total_stamps')
      .limit(50)
    
    const { data: membershipCards, error: membershipError } = await supabase
      .from('membership_cards')
      .select('id, name, business_id, total_sessions')
      .limit(20)
    
    if (stampError || membershipError) {
      throw new Error(`Failed to fetch cards: ${stampError?.message || membershipError?.message}`)
    }
    
    
    let customersCreated = 0
    let customerCardsCreated = 0
    let sessionUsageCreated = 0
    
    // 3. Create customers for each business
    for (const business of businesses) {
      // Create 3-5 customers per business
      const customerCount = Math.floor(Math.random() * 3) + 3
      
      for (let i = 0; i < customerCount; i++) {
        // Generate realistic customer data
        const customerNames = [
          'Emily Johnson', 'Michael Chen', 'Sarah Williams', 'David Kim', 'Jessica Martinez',
          'Ryan Thompson', 'Lisa Zhang', 'James Brown', 'Amanda Taylor', 'Kevin Lee',
          'Sophia Davis', 'Daniel Garcia', 'Rachel Wilson', 'Matthew Rodriguez', 'Ashley Lopez',
          'Christopher Anderson', 'Hannah Thomas', 'Nicholas Jackson', 'Lauren White', 'Brandon Harris'
        ]
        
        const customerName = customerNames[Math.floor(Math.random() * customerNames.length)]
        const customerEmail = `${customerName.toLowerCase().replace(' ', '.')}@gmail.com`
        
        // Create user first
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            email: customerEmail,
            role_id: 3 // Customer role
          })
          .select()
          .single()
        
        if (userError) {
          continue
        }
        
        // Create customer profile
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: customerName,
            email: customerEmail
          })
          .select()
          .single()
        
        if (customerError) {
          continue
        }
        
        customersCreated++
        
        // 4. Assign 1-3 cards to each customer
        const cardsToAssign = Math.floor(Math.random() * 3) + 1
        const businessCards = [
          ...(stampCards?.filter(c => c.business_id === business.id) || []),
          ...(membershipCards?.filter(c => c.business_id === business.id) || [])
        ]
        
        if (businessCards.length === 0) {
          continue
        }
        
        // Randomly select cards for this customer
        const shuffledCards = businessCards.sort(() => 0.5 - Math.random())
        const selectedCards = shuffledCards.slice(0, Math.min(cardsToAssign, businessCards.length))
        
        for (const card of selectedCards) {
          // Determine if this is a stamp card or membership card
          const isStampCard = stampCards?.some(sc => sc.id === card.id)
          const isMembershipCard = membershipCards?.some(mc => mc.id === card.id)
          
          if (isStampCard) {
            // Create stamp card for customer
            const currentStamps = Math.floor(Math.random() * ((card as any).total_stamps || 10))
            const membershipType = 'loyalty'
            
            const { data: customerCard, error: cardError } = await supabase
              .from('customer_cards')
              .insert({
                customer_id: customer.id,
                stamp_card_id: card.id,
                current_stamps: currentStamps,
                membership_type: membershipType,
                wallet_type: ['apple', 'google', 'pwa'][Math.floor(Math.random() * 3)]
              })
              .select()
              .single()
            
            if (!cardError) {
              customerCardsCreated++
              
              // Add stamp usage history
              for (let stampNum = 0; stampNum < currentStamps; stampNum++) {
                const daysAgo = Math.floor(Math.random() * 30) + 1
                const usageDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
                
                await supabase
                  .from('session_usage')
                  .insert({
                    customer_card_id: customerCard.id,
                    business_id: business.id,
                    session_date: usageDate.toISOString(),
                    usage_type: 'stamp',
                    notes: `Stamp #${stampNum + 1}`
                  })
                
                sessionUsageCreated++
              }
              
            }
          } else if (isMembershipCard) {
            // Create membership card for customer
            const totalSessions = (card as any).total_sessions || 20
            const sessionsUsed = Math.floor(Math.random() * totalSessions)
            const membershipType = 'gym'
            const cost = 15000 // ₩15,000
            const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            
            const { data: customerCard, error: cardError } = await supabase
              .from('customer_cards')
              .insert({
                customer_id: customer.id,
                stamp_card_id: card.id,
                current_stamps: 0,
                membership_type: membershipType,
                total_sessions: totalSessions,
                sessions_used: sessionsUsed,
                cost: cost,
                expiry_date: expiryDate.toISOString(),
                wallet_type: ['apple', 'google', 'pwa'][Math.floor(Math.random() * 3)]
              })
              .select()
              .single()
            
            if (!cardError) {
              customerCardsCreated++
              
              // Add session usage history
              for (let sessionNum = 0; sessionNum < sessionsUsed; sessionNum++) {
                const daysAgo = Math.floor(Math.random() * 30) + 1
                const usageDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
                
                await supabase
                  .from('session_usage')
                  .insert({
                    customer_card_id: customerCard.id,
                    business_id: business.id,
                    session_date: usageDate.toISOString(),
                    usage_type: 'session',
                    notes: `Gym session #${sessionNum + 1}`
                  })
                
                sessionUsageCreated++
              }
              
            }
          }
        }
      }
    }
    
    // 5. Get final counts for verification
    const { count: finalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
    
    const { count: finalCustomerCards } = await supabase
      .from('customer_cards')
      .select('*', { count: 'exact', head: true })
    
    const { count: finalSessionUsage } = await supabase
      .from('session_usage')
      .select('*', { count: 'exact', head: true })
    
    const result = {
      success: true,
      message: 'Realistic test data created successfully',
      summary: {
        customersCreated,
        customerCardsCreated,
        sessionUsageCreated,
        finalCounts: {
          totalCustomers: finalCustomers || 0,
          totalCustomerCards: finalCustomerCards || 0,
          totalSessionUsage: finalSessionUsage || 0
        }
      },
      timestamp: new Date().toISOString()
    }
    
    
    return NextResponse.json(result)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to seed realistic data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 