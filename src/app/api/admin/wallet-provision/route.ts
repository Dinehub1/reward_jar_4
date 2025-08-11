import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server-only';
import { createAdminClient } from '@/lib/supabase/admin-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role_id !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const statuses = [];
    const timestamp = new Date().toISOString();

    // Apple Wallet Status
    try {
      const appleStatus = {
        service: 'Apple Wallet',
        configured: !!(process.env.APPLE_WALLET_TEAM_ID && 
                      process.env.APPLE_WALLET_KEY_ID && 
                      process.env.APPLE_WALLET_PRIVATE_KEY),
        endpoint: '/api/wallet/apple/[customerCardId]',
        status: 'operational',
        lastUpdated: timestamp
      };
      statuses.push(appleStatus);
    } catch (error) {
      statuses.push({
        service: 'Apple Wallet',
        configured: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: timestamp
      });
    }

    // Google Wallet Status  
    try {
      const googleStatus = {
        service: 'Google Wallet',
        configured: !!(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
                      process.env.GOOGLE_WALLET_PRIVATE_KEY &&
                      process.env.GOOGLE_WALLET_ISSUER_ID),
        endpoint: '/api/wallet/google/[customerCardId]',
        status: 'operational',
        lastUpdated: timestamp
      };
      statuses.push(googleStatus);
    } catch (error) {
      statuses.push({
        service: 'Google Wallet',
        configured: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: timestamp
      });
    }

    // PWA Wallet (always succeeds as fallback)
    statuses.push({
      service: 'PWA Wallet',
      configured: true,
      endpoint: '/api/wallet/pwa/[customerCardId]',
      status: 'operational',
      lastUpdated: timestamp
    });

    return NextResponse.json({
      status: 'success',
      timestamp,
      services: statuses,
      summary: {
        totalServices: statuses.length,
        operational: statuses.filter(s => s.status === 'operational').length,
        configured: statuses.filter(s => s.configured).length
      }
    });

  } catch (error) {
    console.error('Wallet provision check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown wallet provision error'
    }, { status: 500 });
  }

  return NextResponse.json({
    status: 'success',
    message: 'Wallet provision health check completed'
  });
}