import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server-only';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { buildGoogleIds, createLoyaltyObject } from '@/lib/wallet/builders/google-pass-builder';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params;
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    if (!customerCardId) {
      return NextResponse.json({ error: 'Customer card ID is required' }, { status: 400 });
    }

    // Fetch customer card with related data using admin client
    const { data: customerCard, error: cardError } = await adminClient
      .from('customer_cards')
      .select(`
        id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        stamp_card:stamp_cards(
          id,
          name,
          card_color,
          icon_emoji,
          total_stamps,
          reward_description,
          business_id
        ),
        membership_card:membership_cards(
          id,
          name,
          card_color,
          icon_emoji,
          total_sessions,
          cost,
          business_id
        ),
        customer:customers(
          id,
          name,
          email
        )
      `)
      .eq('id', customerCardId)
      .single();

    if (cardError || !customerCard) {
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 });
    }

    const isStampCard = !!customerCard.stamp_card_id;
    const isMembershipCard = !!customerCard.membership_card_id;

    if (!isStampCard && !isMembershipCard) {
      return NextResponse.json(
        { error: 'Invalid customer card: no card type found' },
        { status: 400 }
      );
    }

    const cardData = isStampCard ? customerCard.stamp_card : customerCard.membership_card;

    // Fetch business data
    const { data: businessData, error: businessError } = await adminClient
      .from('businesses')
      .select('*')
      .eq('id', cardData.business_id)
      .single();

    if (businessError || !businessData) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Build Google Wallet IDs
    const googleIds = buildGoogleIds(customerCardId);

    // Calculate progress for display
    let progress = 0;
    let progressLabel = '';
    
    if (isStampCard) {
      progress = Math.min((customerCard.current_stamps / cardData.total_stamps) * 100, 100);
      progressLabel = `${customerCard.current_stamps} / ${cardData.total_stamps} stamps`;
    } else {
      const sessionsUsed = customerCard.sessions_used || 0;
      const totalSessions = cardData.total_sessions || 1;
      progress = Math.min((sessionsUsed / totalSessions) * 100, 100);
      progressLabel = `${sessionsUsed} / ${totalSessions} sessions used`;
    }

    // Create Google Wallet loyalty object
    const loyaltyObject = createLoyaltyObject({
      customerCardId,
      cardData: {
        name: cardData.name,
        total_stamps: cardData.total_stamps,
        reward_description: cardData.reward_description,
        card_color: cardData.card_color,
        cost: cardData.cost,
        total_sessions: cardData.total_sessions,
      },
      businessData: {
        name: businessData.name,
        description: businessData.description,
        address: businessData.address,
        phone: businessData.phone,
        email: businessData.email,
        logo_url: businessData.logo_url,
      },
      customerData: {
        current_stamps: customerCard.current_stamps,
        sessions_used: customerCard.sessions_used,
        created_at: customerCard.created_at,
        expiry_date: customerCard.expiry_date,
      },
      derived: {
        progressLabel,
        progressPercent: progress,
        isExpired: isMembershipCard ? (customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false) : undefined,
      },
      ids: googleIds,
      locale: businessData.locale || 'en-IN',
    });

    // Check for debug mode
    const debugMode = request.nextUrl.searchParams.get('debug') === 'true';
    
    if (debugMode) {
      return NextResponse.json({
        message: 'Google Wallet endpoint working',
        customerCard: {
          id: customerCard.id,
          type: isStampCard ? 'stamp' : 'membership',
          current_stamps: customerCard.current_stamps,
          sessions_used: customerCard.sessions_used,
        },
        business: {
          name: businessData.name,
          id: businessData.id,
        },
        loyaltyObject: {
          id: loyaltyObject.id,
          classId: loyaltyObject.classId,
          state: loyaltyObject.state,
        },
        googleIds,
        progress: {
          percent: progress,
          label: progressLabel,
        },
        environment: {
          hasGoogleCredentials: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLIENT_EMAIL),
          hasIssuerAccount: !!process.env.GOOGLE_WALLET_ISSUER_ACCOUNT,
          hasClassSuffix: !!(process.env.GOOGLE_WALLET_CLASS_SUFFIX || process.env.GOOGLE_WALLET_CLASS_SUFFIX_STAMP),
        }
      });
    }

    // In production, this would create a Save to Google Wallet JWT and redirect
    // For now, return a JSON response indicating the service is ready
    return NextResponse.json({
      success: true,
      message: 'Google Wallet integration ready',
      saveUrl: `https://pay.google.com/gp/v/save/${loyaltyObject.id}`,
      loyaltyObjectId: loyaltyObject.id,
      classId: loyaltyObject.classId,
    });

  } catch (error) {
    console.error('Google Wallet error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate Google Wallet pass',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}