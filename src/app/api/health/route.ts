import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // Test database connectivity
    const { data: businesses, error: businessError } = await adminClient
      .from('businesses')
      .select('id')
      .limit(1);

    const { data: customers, error: customerError } = await adminClient
      .from('customers')
      .select('id')
      .limit(1);

    const { data: cards, error: cardsError } = await adminClient
      .from('customer_cards')
      .select('id')
      .limit(1);

    const databaseHealth = !businessError && !customerError && !cardsError;

    const healthStatus = {
      status: databaseHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: databaseHealth ? 'operational' : 'error',
          details: {
            businesses: !businessError,
            customers: !customerError,
            cards: !cardsError
          },
          errors: [businessError, customerError, cardsError].filter(Boolean)
        },
        api: {
          status: 'operational',
          details: 'API endpoints responding normally'
        }
      }
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown health check error'
    }, { status: 500 });
  }
}