import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuid } from 'uuid'

// Type definition for membership data from Supabase
interface MembershipRecord {
  id: string
  membership_type: string
  sessions_used: number
  total_sessions: number
  cost: number
  expiry_date: string | null
  wallet_type: string | null
  created_at: string
  customers: {
    id: string
    name: string
    email: string
  }[] | null
}

// Test scenarios for gym membership cards
const MEMBERSHIP_SCENARIOS = {
  new_membership: {
    name: 'New Gym Membership',
    sessions_used: 0,
    total_sessions: 20,
    cost: 15000,
    expired: false,
    description: 'Brand new membership with no sessions used'
  },
  partially_used: {
    name: 'Partially Used Membership',
    sessions_used: 8,
    total_sessions: 20,
    cost: 15000,
    expired: false,
    description: '8 sessions used, 12 remaining'
  },
  nearly_complete: {
    name: 'Nearly Complete Membership',
    sessions_used: 18,
    total_sessions: 20,
    cost: 15000,
    expired: false,
    description: '18 sessions used, 2 remaining'
  },
  fully_used: {
    name: 'Fully Used Membership',
    sessions_used: 20,
    total_sessions: 20,
    cost: 15000,
    expired: false,
    description: 'All sessions consumed'
  },
  expired_active: {
    name: 'Expired with Sessions',
    sessions_used: 5,
    total_sessions: 20,
    cost: 15000,
    expired: true,
    description: 'Expired membership with remaining sessions'
  },
  expired_unused: {
    name: 'Expired Unused',
    sessions_used: 0,
    total_sessions: 20,
    cost: 15000,
    expired: true,
    description: 'Expired membership with no sessions used'
  },
  high_value: {
    name: 'Premium Membership',
    sessions_used: 2,
    total_sessions: 50,
    cost: 50000,
    expired: false,
    description: 'High-value premium membership'
  },
  low_value: {
    name: 'Basic Package',
    sessions_used: 1,
    total_sessions: 5,
    cost: 7500,
    expired: false,
    description: 'Basic 5-session package'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scenario, count = 1, cleanup = false } = await request.json()
    const supabase = await createClient()
    
    // Cleanup existing test data if requested
    if (cleanup) {
      console.log('🧹 Cleaning up test membership data...')
      
      // Delete test customer cards (membership type)
      const { error: cleanupError } = await supabase
        .from('customer_cards')
        .delete()
        .eq('membership_type', 'gym')
        .like('customers.name', '%Test%')
        
      if (cleanupError) {
        console.warn('Cleanup warning:', cleanupError)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Test data cleanup completed',
        timestamp: new Date().toISOString()
      })
    }
    
    // Determine scenarios to create
    const scenariosToCreate = scenario === 'all' ? Object.keys(MEMBERSHIP_SCENARIOS) : [scenario]
    
    if (scenario !== 'all' && !MEMBERSHIP_SCENARIOS[scenario as keyof typeof MEMBERSHIP_SCENARIOS]) {
      return NextResponse.json(
        { error: `Unknown scenario: ${scenario}. Available: ${Object.keys(MEMBERSHIP_SCENARIOS).join(', ')}` },
        { status: 400 }
      )
    }
    
    const results = []
    const errors = [] // Track errors for debugging
    
          for (const scenarioKey of scenariosToCreate) {
        for (let i = 0; i < count; i++) {
          const config = MEMBERSHIP_SCENARIOS[scenarioKey as keyof typeof MEMBERSHIP_SCENARIOS]
        
        try {
          // Use existing real data instead of hardcoded UUIDs
          
          // Get an existing business (preferably one that could be a gym)
          const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name, owner_id')
            .limit(1)
            .single()

          if (!businesses) {
            const error = 'No businesses found in database'
            console.error(error)
            errors.push({ scenario: scenarioKey, iteration: i + 1, error })
            continue
          }

          const businessId = businesses.id
          
          // Create or get a dedicated stamp card for gym testing to avoid conflicts
          const gymCardName = `Gym Test Card ${scenarioKey} ${i}`
          const { data: gymStampCard, error: gymStampError } = await supabase
            .from('stamp_cards')
            .insert({
              business_id: businessId,
              name: gymCardName,
              total_stamps: 1, // Minimal stamps for gym reference
              reward_description: `Test reward for ${scenarioKey} scenario`
            })
            .select()
            .single()

          if (gymStampError || !gymStampCard) {
            const error = `Failed to create gym stamp card: ${gymStampError?.message}`
            console.error(error)
            errors.push({ scenario: scenarioKey, iteration: i + 1, error })
            continue
          }
          
          // Get any customers for testing (since each has a unique stamp card now)
          const { data: availableCustomers } = await supabase
            .from('customers')
            .select('id, name, user_id')
            .limit(20) // Get customers for testing
            
          if (!availableCustomers || availableCustomers.length === 0) {
            const error = 'No customers found in database'
            console.error(error)
            errors.push({ scenario: scenarioKey, iteration: i + 1, error })
            continue
          }

          // Use a different customer for each scenario/iteration
          const customerIndex = (scenariosToCreate.indexOf(scenarioKey) * 10 + i) % availableCustomers.length
          const selectedCustomer = availableCustomers[customerIndex]
          const customerId = selectedCustomer.id
          
          // Use the existing membership card template or create one if needed
          const membershipCardId = 'ab4b5394-89d5-4389-a3b1-5614be74dc6b' // The Premium Gym Membership we know exists
          
          // Verify the membership card exists, if not create it
          const { data: existingMembershipCard } = await supabase
            .from('membership_cards')
            .select('*')
            .eq('id', membershipCardId)
            .single()

          let membershipCard = existingMembershipCard
          
          if (!membershipCard) {
            // Create membership card template if it doesn't exist
            const { data: newMembershipCard, error: cardError } = await supabase
              .from('membership_cards')
              .insert({
                business_id: businessId,
                name: config.name,
                membership_type: 'gym',
                total_sessions: config.total_sessions,
                cost: config.cost,
                duration_days: 365
              })
              .select()
              .single()
              
            if (cardError) {
              console.error('Membership card creation error:', cardError)
              continue
            }
            
            membershipCard = newMembershipCard
          }
          
          // Create customer card (the actual membership instance)
          const customerCardId = uuid()
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 365) // 1 year from now
          
          console.log(`Attempting to create customer card with:`, {
            customerCardId,
            customerId,
            stampCardId: gymStampCard.id,
            membershipType: 'gym',
            sessionsUsed: config.sessions_used,
            totalSessions: config.total_sessions
          })
          
          const { data: customerCard, error: customerCardError } = await supabase
            .from('customer_cards')
            .insert({
              id: customerCardId,
              customer_id: customerId,
              stamp_card_id: gymStampCard.id, // Use existing stamp card for foreign key
              membership_type: 'gym',
              total_sessions: config.total_sessions,
              sessions_used: config.sessions_used,
              cost: config.cost,
              expiry_date: config.expired ? '2024-01-01T00:00:00Z' : expiryDate.toISOString(),
              current_stamps: 0,
              wallet_type: 'pwa'
            })
            .select()
            .single()
            
          if (customerCardError) {
            const errorDetail = `Customer card creation failed: ${customerCardError.message} | Code: ${customerCardError.code} | Details: ${customerCardError.details}`
            console.error(errorDetail)
            errors.push({ scenario: scenarioKey, iteration: i + 1, error: errorDetail, supabaseError: customerCardError })
            continue
          }
          
          console.log(`✅ Created customer card: ${customerCard.id}`)
          
          // Skip session usage creation for now to isolate the issue
          /*
          // Create session usage history for used sessions
          if (config.sessions_used > 0) {
            const sessionHistory = []
            for (let sessionNum = 1; sessionNum <= config.sessions_used; sessionNum++) {
              const sessionDate = new Date(Date.now() - (config.sessions_used - sessionNum) * 24 * 60 * 60 * 1000)
              sessionHistory.push({
                customer_card_id: customerCard.id,
                business_id: businessId,
                marked_by: null, // Set to NULL to avoid foreign key constraint issues
                session_date: sessionDate.toISOString(),
                usage_type: 'session',
                notes: `Test session ${sessionNum} for ${scenarioKey}`
              })
            }
            
            const { error: historyError } = await supabase
              .from('session_usage')
              .insert(sessionHistory)
              
            if (historyError) {
              console.warn('Session history creation warning:', historyError)
              console.warn('History error details:', historyError.details)
            } else {
              console.log(`✅ Created ${sessionHistory.length} session usage records`)
            }
          }
          */
          
          results.push({
            scenario: scenarioKey,
            iteration: i + 1,
            customerCardId: customerCard.id,
            business: {
              id: businessId,
              name: businesses.name
            },
            membershipCard: {
              id: membershipCard.id,
              name: membershipCard.name,
              total_sessions: membershipCard.total_sessions,
              cost: membershipCard.cost
            },
            customer: {
              id: customerId,
              name: selectedCustomer.name,
              user_id: selectedCustomer.user_id
            },
            membership: {
              id: customerCard.id,
              sessions_used: config.sessions_used,
              total_sessions: config.total_sessions,
              sessions_remaining: config.total_sessions - config.sessions_used,
              cost: config.cost,
              expiry_date: config.expired ? '2024-01-01T00:00:00Z' : expiryDate.toISOString(),
              is_expired: config.expired,
              progress: (config.sessions_used / config.total_sessions) * 100
            },
            config: {
              ...config,
              expiry_date: config.expired ? '2024-01-01T00:00:00Z' : expiryDate.toISOString()
            }
          })
          
          console.log(`✅ Created membership scenario: ${scenarioKey} #${i + 1}`)
          
        } catch (error) {
          const errorDetail = `Error creating scenario ${scenarioKey} #${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorDetail)
          errors.push({ scenario: scenarioKey, iteration: i + 1, error: errorDetail, originalError: error })
          // Continue with next scenario instead of breaking
        }
      }
    }
    
    console.log(`✅ Created ${results.length} test membership cards`)
    
    return NextResponse.json({
      success: true,
      created: results.length,
      scenarios: scenariosToCreate,
      memberships: results,
      errors: errors, // Include errors for debugging
      available_scenarios: Object.keys(MEMBERSHIP_SCENARIOS),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in membership test data generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate membership test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get existing test membership cards
    const { data: memberships, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        wallet_type,
        created_at,
        customers (
          id,
          name,
          email
        )
      `)
      .eq('membership_type', 'gym')
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (error) {
      console.error('Error fetching test memberships:', error)
      return NextResponse.json(
        { error: 'Failed to fetch test memberships' },
        { status: 500 }
      )
    }
    
    // Transform data to match POST response structure
    const transformedMemberships = (memberships as MembershipRecord[])?.map((membership) => {
      const progress = membership.total_sessions > 0 
        ? Math.round((membership.sessions_used / membership.total_sessions) * 100)
        : 0
      
      const isExpired = membership.expiry_date ? new Date(membership.expiry_date) < new Date() : false
      
      return {
        customerCardId: membership.id,
        scenario: `existing_${membership.sessions_used}_${membership.total_sessions}`,
        membership: {
          id: membership.id,
          sessions_used: membership.sessions_used,
          total_sessions: membership.total_sessions,
          sessions_remaining: membership.total_sessions - membership.sessions_used,
          cost: membership.cost,
          expiry_date: membership.expiry_date,
          is_expired: isExpired,
          progress: progress
        },
        customer: {
          id: membership.customers?.[0]?.id,
          name: membership.customers?.[0]?.name,
          email: membership.customers?.[0]?.email
        }
      }
    }) || []
    
    return NextResponse.json({
      success: true,
      memberships: transformedMemberships,
      count: transformedMemberships.length,
      available_scenarios: Object.keys(MEMBERSHIP_SCENARIOS),
      scenario_descriptions: Object.entries(MEMBERSHIP_SCENARIOS).map(([key, config]) => ({
        scenario: key,
        description: config.description,
        sessions: `${config.sessions_used}/${config.total_sessions}`,
        cost: config.cost,
        expired: config.expired
      })),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching membership test data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership test data' },
      { status: 500 }
    )
  }
} 