import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_BASE_URL'
    ];

    const optionalEnvVars = [
      'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_WALLET_PRIVATE_KEY',
      'GOOGLE_WALLET_ISSUER_ID',
      'APPLE_WALLET_TEAM_ID',
      'APPLE_WALLET_KEY_ID',
      'APPLE_WALLET_PRIVATE_KEY'
    ];

    const envStatus: Record<string, any> = {
      required: {},
      optional: {},
      summary: {
        allRequiredPresent: true,
        totalRequired: requiredEnvVars.length,
        presentRequired: 0,
        totalOptional: optionalEnvVars.length,
        presentOptional: 0
      }
    };

    // Check required environment variables
    requiredEnvVars.forEach(envVar => {
      const isPresent = !!process.env[envVar];
      envStatus.required[envVar] = {
        present: isPresent,
        configured: isPresent && process.env[envVar]!.length > 0
      };
      
      if (isPresent) {
        envStatus.summary.presentRequired++;
      } else {
        envStatus.summary.allRequiredPresent = false;
      }
    });

    // Check optional environment variables
    optionalEnvVars.forEach(envVar => {
      const isPresent = !!process.env[envVar];
      envStatus.optional[envVar] = {
        present: isPresent,
        configured: isPresent && process.env[envVar]!.length > 0
      };
      
      if (isPresent) {
        envStatus.summary.presentOptional++;
      }
    });

    const overallStatus = envStatus.summary.allRequiredPresent ? 'healthy' : 'error';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: envStatus
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown environment check error'
    }, { status: 500 });
  }
}