/**
 * RewardJar 4.0 - Dev Seed API Route
 * Generates demo data for both stamp and membership cards
 * 
 * @version 4.0
 * @path /api/dev-seed
 * @created July 21, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple debouncing mechanism to prevent rapid duplicate calls
let lastGenerationTime = 0
const DEBOUNCE_DELAY = 1000 // 1 second

  // Demo card configurations
  const DEMO_CARDS = [
    // Stamp Cards (Loyalty subtype)
    {
      id: '3e234610-9953-4a8b-950e-b03a1924a1fe',
      membership_type: 'loyalty',
      current_stamps: 3,
      total_stamps: 10,
      business_name: 'NIO Coffee',
      card_name: 'Coffee Loyalty Card',
      reward_description: 'Get your 10th coffee free!',
      grid_layout: '5x2'
    },
  {
    id: '10e2488a-7c4b-495d-a5ee-ec5a7ec4f13e',
    membership_type: 'loyalty',
    current_stamps: 7,
    total_stamps: 12,
    business_name: 'NIO Coffee Premium',
    card_name: 'Premium Rewards Card',
    reward_description: 'Premium blend coffee + pastry combo free!',
    grid_layout: '4x3'
  },
  // Membership Cards (Membership subtype)
  {
    id: '90910c9c-f8cc-4e49-b53c-87863f8f30a5',
    membership_type: 'membership',
    sessions_used: 5,
    total_sessions: 20,
    cost: 15000, // ₩15,000
    business_name: 'FitLife Gym',
    card_name: 'Premium Membership',
    reward_description: 'Full gym access with personal training sessions',
    expiry_days: 90
  },
  {
    id: '27deeb58-376f-4c4a-99a9-244404b50885',
    membership_type: 'membership',
    sessions_used: 8,
    total_sessions: 10,
    cost: 8000, // ₩8,000
    business_name: 'FitLife Basic',
    card_name: 'Basic Membership',
    reward_description: 'Essential gym access and group classes',
    expiry_days: 30
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check for existing cards to avoid duplicates with full related data
    const { data: existingCards, error: checkError } = await supabase
      .from('customer_cards')
      .select(`
        id,
        membership_type, 
        current_stamps,
        sessions_used, 
        total_sessions, 
        cost, 
        expiry_date,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            id,
            name,
            description
          )
        ),
        customers (
          id,
          name,
          email
        )
      `)
      .in('id', DEMO_CARDS.map(card => card.id))

    if (checkError) {
      console.error('Error checking existing cards:', checkError)
    }

    const existingCardIds = existingCards?.map(card => card.id) || []
    const cardsToGenerate = DEMO_CARDS.filter(card => !existingCardIds.includes(card.id))

    return NextResponse.json({
      success: true,
      message: `Found ${existingCards?.length || 0} existing cards, ${cardsToGenerate.length} available for generation`,
      cards: existingCards || [],
      availableForGeneration: cardsToGenerate.length,
      totalCards: DEMO_CARDS.length
    })

  } catch (error) {
    console.error('Error in dev-seed GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check demo cards'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Debounce rapid duplicate calls
    const now = Date.now()
    if (now - lastGenerationTime < DEBOUNCE_DELAY) {
      return NextResponse.json({
        success: true,
        message: 'Request debounced - please wait before generating again',
        debounced: true
      })
    }
    lastGenerationTime = now

    const body = await request.json()
    const { createAll = false, scenario, count = 1 } = body

    // Check for existing cards to prevent duplicates
    const { data: existingCards } = await supabase
      .from('customer_cards')
      .select('id')
      .in('id', DEMO_CARDS.map(card => card.id))

    const existingCardIds = existingCards?.map(card => card.id) || []
    const cardsToGenerate = DEMO_CARDS.filter(card => !existingCardIds.includes(card.id))

    if (cardsToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All demo cards already exist',
        cards: existingCards,
        generated: 0
      })
    }

    // Generate demo businesses first
    const businesses = [
      {
        id: '539c1e0d-c7e8-4237-abb2-90f3ae29f903',
        name: 'NIO Coffee',
        description: 'Premium coffee experience',
        owner_id: '00000000-0000-0000-0000-000000000001'
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'FitLife Gym',
        description: 'Modern fitness center',
        owner_id: '00000000-0000-0000-0000-000000000001'
      }
    ]

    for (const business of businesses) {
      await supabase
        .from('businesses')
        .upsert(business, { onConflict: 'id' })
    }

    // Generate stamp card templates
    const stampCardTemplates = cardsToGenerate
      .filter(card => card.membership_type === 'loyalty')
      .map(card => ({
        id: card.id,
        business_id: card.business_name.includes('Coffee') ? businesses[0].id : businesses[1].id,
        name: card.card_name,
        total_stamps: card.total_stamps,
        reward_description: card.reward_description,
        status: 'active'
      }))

    if (stampCardTemplates.length > 0) {
      await supabase
        .from('stamp_cards')
        .upsert(stampCardTemplates, { onConflict: 'id' })
    }

    // Generate membership card templates
    const membershipCardTemplates = cardsToGenerate
      .filter(card => card.membership_type === 'membership')
      .map(card => ({
        id: card.id,
        business_id: businesses[1].id, // FitLife Gym
        name: card.card_name,
        membership_type: 'membership', // Updated to use 'membership' instead of 'gym'
        total_sessions: card.total_sessions,
        cost: card.cost,
        duration_days: card.expiry_days,
        status: 'active'
      }))

    if (membershipCardTemplates.length > 0) {
      await supabase
        .from('membership_cards')
        .upsert(membershipCardTemplates, { onConflict: 'id' })
    }

    // Generate demo customer
    const demoCustomer = {
      id: '00000000-0000-0000-0000-000000000002',
      user_id: '00000000-0000-0000-0000-000000000003',
      name: 'Demo Customer',
      email: 'demo@rewardjar.com'
    }

    await supabase
      .from('customers')
      .upsert(demoCustomer, { onConflict: 'id' })

    // Generate customer cards
    const customerCards = cardsToGenerate.map(card => ({
      id: card.id,
      customer_id: demoCustomer.id,
      stamp_card_id: card.id,
      current_stamps: card.current_stamps || 0,
      membership_type: card.membership_type,
      total_sessions: card.total_sessions,
      sessions_used: card.sessions_used || 0,
      cost: card.cost,
      expiry_date: card.expiry_days 
        ? new Date(Date.now() + card.expiry_days * 24 * 60 * 60 * 1000).toISOString()
        : null,
      wallet_type: 'pwa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }))

    const { data: createdCards, error: createError } = await supabase
      .from('customer_cards')
      .upsert(customerCards, { onConflict: 'id' })
      .select()

    if (createError) {
      throw createError
    }

    // Generate card customizations
    const customizations = cardsToGenerate.map(card => ({
      business_id: card.business_name.includes('Coffee') ? businesses[0].id : businesses[1].id,
      card_type: card.membership_type === 'loyalty' ? 'stamp' : 'membership',
      business_name: card.business_name,
      logo_url: `https://example.com/${card.business_name.toLowerCase().replace(' ', '-')}-logo.png`,
      total_stamps_or_sessions: card.total_stamps || card.total_sessions,
      expiry_days: card.expiry_days || 365,
      stamp_grid_layout: card.grid_layout || '5x2',
      primary_color: card.membership_type === 'loyalty' ? '#10b981' : '#6366f1',
      secondary_color: card.membership_type === 'loyalty' ? '#047857' : '#4338ca'
    }))

    for (const customization of customizations) {
      await supabase
        .from('card_customizations')
        .upsert(customization, { onConflict: 'business_id,card_type' })
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${cardsToGenerate.length} demo cards (${cardsToGenerate.filter(c => c.membership_type === 'loyalty').length} stamp, ${cardsToGenerate.filter(c => c.membership_type === 'membership').length} membership)`,
      cards: createdCards,
      generated: cardsToGenerate.length,
      subtypes: {
        loyalty: cardsToGenerate.filter(c => c.membership_type === 'loyalty').length,
        membership: cardsToGenerate.filter(c => c.membership_type === 'membership').length
      }
    })

  } catch (error) {
    console.error('Error generating demo cards:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate demo cards',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 