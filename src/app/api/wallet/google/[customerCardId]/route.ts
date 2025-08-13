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

    // Create Google Wallet loyalty object with correct parameters
    const customerName = customerCard.customer?.name || 'Guest User'
    const objectDisplayId = customerCardId // Use customerCardId as display ID
    const current = isStampCard ? (customerCard.current_stamps || 0) : (customerCard.sessions_used || 0)
    const total = isStampCard ? cardData.total_stamps : cardData.total_sessions
    
    const loyaltyObject = createLoyaltyObject({
      ids: googleIds,
      current,
      total,
      displayName: customerName,
      objectDisplayId,
      label: isStampCard ? 'Stamps' : 'Sessions',
      textModulesData: [
        {
          header: 'Business',
          body: businessData.name
        },
        {
          header: 'Reward',
          body: cardData.reward_description || 'Loyalty reward'
        }
      ]
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
          accountName: loyaltyObject.accountName,
          loyaltyPoints: loyaltyObject.loyaltyPoints,
        },
        googleIds,
        progress: {
          percent: progress,
          label: progressLabel,
        },
        environment: {
          hasServiceAccountEmail: !!(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
          hasPrivateKey: !!(process.env.GOOGLE_WALLET_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
          hasIssuerId: !!process.env.GOOGLE_WALLET_ISSUER_ID,
          hasClassSuffix: !!(process.env.GOOGLE_WALLET_CLASS_SUFFIX || process.env.GOOGLE_WALLET_CLASS_SUFFIX_STAMP),
          emailValue: (process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) ? 'SET' : 'NOT_SET',
          privateKeyLength: (process.env.GOOGLE_WALLET_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)?.length || 0,
        }
      });
    }

    // Create the actual Google Wallet JWT and save URL
    try {
      const { createSaveToWalletJwt, buildSaveUrl } = await import('@/lib/wallet/builders/google-pass-builder');
      
      // Check if Google Wallet is properly configured
      const hasCredentials = !!((process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) && (process.env.GOOGLE_WALLET_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY));
      
      if (!hasCredentials) {
        return NextResponse.json({
          success: false,
          error: 'Google Wallet not configured',
          message: 'Missing Google Wallet credentials. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables.',
          debug: {
            hasEmail: !!(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
            hasPrivateKey: !!(process.env.GOOGLE_WALLET_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
          }
        }, { status: 500 });
      }
      
      // Create JWT for Google Wallet
      const jwt = createSaveToWalletJwt(loyaltyObject);
      const saveUrl = buildSaveUrl(jwt);
      
      return NextResponse.json({
        success: true,
        message: 'Google Wallet pass ready',
        saveUrl,
        loyaltyObjectId: loyaltyObject.id,
        classId: loyaltyObject.classId,
        jwt: jwt.substring(0, 50) + '...' // Only show first 50 chars for debugging
      });
      
    } catch (jwtError) {
      console.error('Google Wallet JWT creation failed:', jwtError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create Google Wallet JWT',
        message: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error',
        details: {
          loyaltyObject: {
            id: loyaltyObject.id,
            classId: loyaltyObject.classId,
          },
          environment: {
            hasEmail: !!(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
            hasPrivateKey: !!(process.env.GOOGLE_WALLET_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
          }
        }
      }, { status: 500 });
    }

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