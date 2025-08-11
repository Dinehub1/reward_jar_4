import { createAdminClient } from '@/lib/supabase/admin-client'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { buildPwaHtml } from '@/lib/wallet/builders/pwa-pass-builder'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId
    const supabase = createAdminClient()


    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select('*')
      .eq('id', customerCardId)
      .single()
    
    
    if (error || !customerCard) {
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 })
    }
    
    // Now fetch the related data separately
    let cardData: any = null
    let businessData: any = null
    
    if (customerCard.stamp_card_id) {
      const { data: stampCard, error: stampError } = await supabase
        .from('stamp_cards')
        .select(`
          id,
          name,
          total_stamps,
          reward_description,
          card_color,
          icon_emoji,
          businesses!business_id (
            id,
            name,
            description,
            currency_code,
            locale
          )
        `)
        .eq('id', customerCard.stamp_card_id)
        .single()
      
      if (!stampError && stampCard) {
        cardData = stampCard
        businessData = stampCard.businesses
      }
    } else if (customerCard.membership_card_id) {
      const { data: membershipCard, error: membershipError } = await supabase
        .from('membership_cards')
        .select(`
          id,
          name,
          total_sessions,
          cost,
          card_color,
          icon_emoji,
          businesses!business_id (
            id,
            name,
            description,
            currency_code,
            locale
          )
        `)
        .eq('id', customerCard.membership_card_id)
        .single()
      
      if (!membershipError && membershipCard) {
        cardData = membershipCard
        businessData = membershipCard.businesses
      }
    }

    if (!cardData || !businessData) {
      return NextResponse.json({ error: 'Card template or business data not found' }, { status: 404 })
    }

    // Determine card type from unified schema
    const isStampCard = customerCard.stamp_card_id !== null
    const isMembershipCard = customerCard.membership_card_id !== null

    if (!isStampCard && !isMembershipCard) {
      return NextResponse.json(
        { error: 'Invalid customer card: no card type found' },
        { status: 400 }
      )
    }

    // cardData and businessData are already set above from separate queries

      id: customerCard.id,
      isStampCard,
      isMembershipCard,
      current_stamps: customerCard.current_stamps,
      sessions_used: customerCard.sessions_used
    })

    // Determine card type
    const cardTitle = isMembershipCard ? 'Membership Card' : 'Stamp Cards'
    const cardColor = cardData.card_color || '#8B4513'
    const isGymMembership = isMembershipCard

    // Generate QR code for PWA actions
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join/${customerCardId}`
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 180, margin: 1 })

    // Build HTML via builder
    const html = buildPwaHtml(
      isMembershipCard
        ? {
            type: 'membership',
            businessName: businessData.name,
            cardName: cardData.name,
            cardColor,
            sessionsUsed: customerCard.sessions_used || 0,
            totalSessions: cardData.total_sessions || 0,
            cost: cardData.cost,
            expiryDate: (customerCard as any).expiry_date || null,
            qrCodeDataUrl: qrCodeDataUrl,
          }
        : {
            type: 'stamp',
            businessName: businessData.name,
            cardName: cardData.name || 'Stamp Cards',
            cardColor,
            iconEmoji: cardData.icon_emoji || '⭐',
            currentStamps: customerCard.current_stamps || 0,
            totalStamps: cardData.total_stamps,
            rewardDescription: cardData.reward_description,
            qrCodeDataUrl: qrCodeDataUrl,
          }
    )

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate PWA wallet',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const testToken = process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'
    
    if (!authHeader?.includes(testToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const supabase = createAdminClient()
    const customerCardId = resolvedParams.customerCardId
    const url = new URL(request.url)
    const requestedType = url.searchParams.get('type') // 'stamp' or 'membership'


    // Reuse the same builder as GET to avoid divergence
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select('*')
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 })
    }

    // Fetch related data
    let cardData: any = null
    let businessData: any = null
    if (customerCard.stamp_card_id) {
      const { data: stampCard } = await supabase
        .from('stamp_cards')
        .select('id,name,total_stamps,reward_description,card_color,icon_emoji,businesses!business_id(id,name,description)')
        .eq('id', customerCard.stamp_card_id)
        .single()
      cardData = stampCard
      businessData = stampCard?.businesses
    } else if (customerCard.membership_card_id) {
      const { data: membershipCard } = await supabase
        .from('membership_cards')
        .select('id,name,total_sessions,cost,card_color,icon_emoji,businesses!business_id(id,name,description)')
        .eq('id', customerCard.membership_card_id)
        .single()
      cardData = membershipCard
      businessData = membershipCard?.businesses
    }

    if (!cardData || !businessData) {
      return NextResponse.json({ error: 'Card template or business data not found' }, { status: 404 })
    }

    const isMembershipCardPost = !!customerCard.membership_card_id
    const cardColorPost = cardData.card_color || '#8B4513'
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join/${customerCardId}`
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 180, margin: 1 })

    const html = buildPwaHtml(
      isMembershipCardPost
        ? {
            type: 'membership',
            businessName: businessData.name,
            cardName: cardData.name,
            cardColor: cardColorPost,
            sessionsUsed: customerCard.sessions_used || 0,
            totalSessions: cardData.total_sessions || 0,
            cost: cardData.cost,
            expiryDate: (customerCard as any).expiry_date || null,
            qrCodeDataUrl,
          }
        : {
            type: 'stamp',
            businessName: businessData.name,
            cardName: cardData.name || 'Stamp Cards',
            cardColor: cardColorPost,
            iconEmoji: cardData.icon_emoji || '⭐',
            currentStamps: customerCard.current_stamps || 0,
            totalStamps: cardData.total_stamps,
            rewardDescription: cardData.reward_description,
            qrCodeDataUrl,
          }
    )

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate PWA wallet' },
      { status: 500 }
    )
  }
} 