import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface CustomerCardData {
  customer_id: string
  stamp_card_id?: string
  membership_card_id?: string
  current_stamps?: number
  sessions_used?: number
  expiry_date?: string
  wallet_type: 'apple' | 'google' | 'pwa'
  wallet_pass_id?: string
}

interface CustomerData {
  user_id: string
  name: string
  email: string
}

export async function POST(request: NextRequest) {
  
  try {
    const supabase = createAdminClient()
    
    // First, get all businesses and their cards
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


    // Generate diverse customers
    const customerNames = [
      'Emma Rodriguez', 'James Chen', 'Sofia Patel', 'Marcus Johnson', 'Aisha Kumar',
      'David Kim', 'Isabella Garcia', 'Ryan O\'Connor', 'Zara Ahmed', 'Lucas Martinez',
      'Olivia Thompson', 'Hassan Ali', 'Chloe Williams', 'Diego Santos', 'Maya Singh',
      'Alex Turner', 'Fatima Hassan', 'Noah Brown', 'Priya Sharma', 'Carlos Lopez',
      'Grace Liu', 'Omar Khalil', 'Lily Wang', 'Antonio Rossi', 'Noor Abbas',
      'Jake Mitchell', 'Aaliyah Jackson', 'Ethan Davis', 'Yasmin Al-Rashid', 'Leo Zhang',
      'Mia Foster', 'Tariq Rahman', 'Ruby Martinez', 'Kai Nakamura', 'Zoe Campbell',
      'Arjun Gupta', 'Ella Peterson', 'Ahmed Osman', 'Luna Hernandez', 'Felix Wong',
      'Ava Taylor', 'Yuki Tanaka', 'Samuel Green', 'Leila Mahmoud', 'Max Cooper',
      'Aria Johansson', 'Ravi Nair', 'Cora Adams', 'Jamal Washington', 'Nina Kozlov'
    ]

    const domains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
      'protonmail.com', 'aol.com', 'live.com', 'mail.com', 'yandex.com'
    ]

    // Create auth users first, then customers
    const usersToCreate = customerNames.map(name => ({
      email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@${domains[Math.floor(Math.random() * domains.length)]}`,
      password: 'TempPassword123!', // Temporary password for test users
      email_confirm: true // Skip email confirmation for test users
    }))


    // Create auth users using admin client
    const createdAuthUsers = []
    for (const userData of usersToCreate) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: userData.email_confirm
        })

        if (authError) {
          continue
        }

        if (authUser.user) {
          createdAuthUsers.push(authUser.user)
        }
      } catch (error) {
        continue
      }
    }


    // Insert users into users table with role_id = 3 (customer)
    const usersTableData = createdAuthUsers.map(authUser => ({
      id: authUser.id,
      email: authUser.email || '',
      role_id: 3 // Customer role
    }))

    const { error: usersError } = await supabase
      .from('users')
      .insert(usersTableData)

    if (usersError) {
    }

    // Now create customers with proper user_id references
    const customersToCreate: CustomerData[] = createdAuthUsers.map((authUser, index) => ({
      user_id: authUser.id,
      name: customerNames[index] || `Customer ${index + 1}`,
      email: authUser.email || ''
    }))


    const { data: createdCustomers, error: customerError } = await supabase
      .from('customers')
      .insert(customersToCreate)
      .select('id, name, email, user_id')

    if (customerError) {
      throw new Error(`Failed to create customers: ${customerError.message}`)
    }


    // Now generate customer cards for each business
    const customerCardsToCreate: CustomerCardData[] = []
    const cardStats = {
      totalCards: 0,
      stampCards: 0,
      membershipCards: 0,
      appleWallet: 0,
      googleWallet: 0,
      pwaWallet: 0
    }

    for (const business of businesses!) {
      
      // For each stamp card in this business
      for (const stampCard of business.stamp_cards) {
        // Generate 10-100 customer cards for this stamp card (reduced for testing)
        const numCustomerCards = Math.floor(Math.random() * 91) + 10 // 10-100
        
        for (let i = 0; i < numCustomerCards; i++) {
          const randomCustomer = createdCustomers![Math.floor(Math.random() * createdCustomers!.length)]
          const walletTypes: ('apple' | 'google' | 'pwa')[] = ['apple', 'google', 'pwa']
          const walletType = walletTypes[Math.floor(Math.random() * walletTypes.length)]
          
          // Generate realistic stamp progress (0 to total_stamps)
          const currentStamps = Math.floor(Math.random() * (stampCard.total_stamps + 1))
          
          customerCardsToCreate.push({
            customer_id: randomCustomer.id,
            stamp_card_id: stampCard.id,
            current_stamps: currentStamps,
            wallet_type: walletType,
            wallet_pass_id: `${walletType}_${stampCard.id}_${randomCustomer.id.slice(-8)}`
          })
          
          cardStats.totalCards++
          cardStats.stampCards++
          if (walletType === 'apple') cardStats.appleWallet++
          else if (walletType === 'google') cardStats.googleWallet++
          else cardStats.pwaWallet++
        }
        
      }
      
      // For each membership card in this business
      for (const membershipCard of business.membership_cards) {
        // Generate 10-100 customer cards for this membership card (reduced for testing)
        const numCustomerCards = Math.floor(Math.random() * 91) + 10 // 10-100
        
        for (let i = 0; i < numCustomerCards; i++) {
          const randomCustomer = createdCustomers![Math.floor(Math.random() * createdCustomers!.length)]
          const walletTypes: ('apple' | 'google' | 'pwa')[] = ['apple', 'google', 'pwa']
          const walletType = walletTypes[Math.floor(Math.random() * walletTypes.length)]
          
          // Generate realistic session usage (0 to total_sessions)
          const sessionsUsed = Math.floor(Math.random() * (membershipCard.total_sessions + 1))
          
          // Generate expiry date (30-365 days from now)
          const daysFromNow = Math.floor(Math.random() * 336) + 30 // 30-365 days
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + daysFromNow)
          
          customerCardsToCreate.push({
            customer_id: randomCustomer.id,
            membership_card_id: membershipCard.id,
            sessions_used: sessionsUsed,
            expiry_date: expiryDate.toISOString(),
            wallet_type: walletType,
            wallet_pass_id: `${walletType}_${membershipCard.id}_${randomCustomer.id.slice(-8)}`
          })
          
          cardStats.totalCards++
          cardStats.membershipCards++
          if (walletType === 'apple') cardStats.appleWallet++
          else if (walletType === 'google') cardStats.googleWallet++
          else cardStats.pwaWallet++
        }
        
      }
    }


    // Insert customer cards in batches to avoid overwhelming the database
    const batchSize = 1000
    let insertedCards = 0
    
    for (let i = 0; i < customerCardsToCreate.length; i += batchSize) {
      const batch = customerCardsToCreate.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('customer_cards')
        .insert(batch)
      
      if (insertError) {
        // Continue with next batch instead of failing completely
        continue
      }
      
      insertedCards += batch.length
    }

    // Final verification
    const { count: finalCount } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })

    const { count: finalStampCount } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .not('stamp_card_id', 'is', null)

    const { count: finalMembershipCount } = await supabase
      .from('customer_cards')
      .select('id', { count: 'exact', head: true })
      .not('membership_card_id', 'is', null)

    const result = {
      success: true,
      message: 'Comprehensive test card data generated successfully!',
      stats: {
        businessesProcessed: businesses?.length || 0,
        authUsersCreated: createdAuthUsers.length,
        customersCreated: createdCustomers?.length || 0,
        customerCardsCreated: insertedCards,
        finalTotalCards: finalCount || 0,
        finalStampCards: finalStampCount || 0,
        finalMembershipCards: finalMembershipCount || 0,
        cardDistribution: cardStats
      },
      businesses: businesses?.map(b => ({
        name: b.name,
        stampCards: b.stamp_cards.length,
        membershipCards: b.membership_cards.length
      }))
    }


    return NextResponse.json(result)

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate comprehensive card data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 