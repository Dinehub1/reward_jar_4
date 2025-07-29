import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  console.log('🎯 REALISTIC CARD GENERATION - Creating diverse test data...')
  
  try {
    const supabase = createAdminClient()
    
    // Get all businesses and their cards
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        stamp_cards(id, name, total_stamps, reward_description),
        membership_cards(id, name, total_sessions, cost, duration_days)
      `)
      .order('name')

    if (businessError) {
      throw new Error(`Failed to fetch businesses: ${businessError.message}`)
    }

    // Get all customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')

    if (customerError) {
      throw new Error(`Failed to fetch customers: ${customerError.message}`)
    }

    console.log(`📊 Found ${businesses?.length} businesses and ${customers?.length} customers`)

    const customerCardsToCreate = []
    const walletTypes: ('apple' | 'google' | 'pwa')[] = ['apple', 'google', 'pwa']

    // Generate realistic customer cards for each business
    for (const business of businesses!) {
      console.log(`🏢 Processing ${business.name}...`)
      
      // For each stamp card, create 5-15 customer cards
      for (const stampCard of business.stamp_cards) {
        const numCards = Math.floor(Math.random() * 11) + 5 // 5-15 cards
        
        for (let i = 0; i < numCards; i++) {
          const randomCustomer = customers![Math.floor(Math.random() * customers!.length)]
          const walletType = walletTypes[Math.floor(Math.random() * walletTypes.length)]
          const currentStamps = Math.floor(Math.random() * (stampCard.total_stamps + 1))
          
          customerCardsToCreate.push({
            customer_id: randomCustomer.id,
            stamp_card_id: stampCard.id,
            current_stamps: currentStamps,
            wallet_type: walletType,
            wallet_pass_id: `${walletType}_${stampCard.id}_${Date.now()}_${i}`
          })
        }
        console.log(`  📮 Created ${numCards} cards for ${stampCard.name}`)
      }
      
      // For each membership card, create 3-10 customer cards
      for (const membershipCard of business.membership_cards) {
        const numCards = Math.floor(Math.random() * 8) + 3 // 3-10 cards
        
        for (let i = 0; i < numCards; i++) {
          const randomCustomer = customers![Math.floor(Math.random() * customers!.length)]
          const walletType = walletTypes[Math.floor(Math.random() * walletTypes.length)]
          const sessionsUsed = Math.floor(Math.random() * (membershipCard.total_sessions + 1))
          
          // Generate expiry date (30-365 days from now)
          const daysFromNow = Math.floor(Math.random() * 336) + 30
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + daysFromNow)
          
          customerCardsToCreate.push({
            customer_id: randomCustomer.id,
            membership_card_id: membershipCard.id,
            sessions_used: sessionsUsed,
            expiry_date: expiryDate.toISOString(),
            wallet_type: walletType,
            wallet_pass_id: `${walletType}_${membershipCard.id}_${Date.now()}_${i}`
          })
        }
        console.log(`  🎟️ Created ${numCards} cards for ${membershipCard.name}`)
      }
    }

    console.log(`🎯 Total customer cards to create: ${customerCardsToCreate.length}`)

    // Insert customer cards in smaller batches
    const batchSize = 100
    let insertedCards = 0
    let failedInserts = 0
    
    for (let i = 0; i < customerCardsToCreate.length; i += batchSize) {
      const batch = customerCardsToCreate.slice(i, i + batchSize)
      
      try {
        const { data: insertedBatch, error: insertError } = await supabase
          .from('customer_cards')
          .insert(batch)
          .select('id')
        
        if (insertError) {
          console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError.message)
          failedInserts += batch.length
          continue
        }
        
        insertedCards += batch.length
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(customerCardsToCreate.length/batchSize)} (${insertedCards}/${customerCardsToCreate.length} cards)`)
        
      } catch (error) {
        console.error(`❌ Exception inserting batch ${Math.floor(i/batchSize) + 1}:`, error)
        failedInserts += batch.length
        continue
      }
    }

    // Final verification
    const { data: finalCount } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })

    const { data: finalStampCount } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .not('stamp_card_id', 'is', null)

    const { data: finalMembershipCount } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .not('membership_card_id', 'is', null)

    // Calculate wallet distribution
    const { data: appleCards } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_type', 'apple')

    const { data: googleCards } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_type', 'google')

    const { data: pwaCards } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_type', 'pwa')

    const result = {
      success: true,
      message: 'Realistic test card data generated successfully!',
      stats: {
        businessesProcessed: businesses?.length || 0,
        customersAvailable: customers?.length || 0,
        cardsAttempted: customerCardsToCreate.length,
        cardsInserted: insertedCards,
        cardsFailed: failedInserts,
        finalTotalCards: finalCount?.count || 0,
        finalStampCards: finalStampCount?.count || 0,
        finalMembershipCards: finalMembershipCount?.count || 0,
        walletDistribution: {
          apple: appleCards?.count || 0,
          google: googleCards?.count || 0,
          pwa: pwaCards?.count || 0
        }
      },
      businesses: businesses?.map(b => ({
        name: b.name,
        stampCards: b.stamp_cards.length,
        membershipCards: b.membership_cards.length,
        estimatedCustomerCards: (b.stamp_cards.length * 10) + (b.membership_cards.length * 6.5) // Average
      }))
    }

    console.log('🎉 REALISTIC CARD GENERATION COMPLETE!')
    console.log('📊 Final Results:', result.stats)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ REALISTIC CARD GENERATION ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate realistic card data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 