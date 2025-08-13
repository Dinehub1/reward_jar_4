/**
 * Enhanced Google Wallet API Endpoint
 * Production-ready with full compliance and error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { EnhancedGoogleWalletBuilder } from '@/lib/wallet/google/enhanced-builder'
import type { GoogleWalletPassData } from '@/lib/wallet/google/enhanced-builder'
import { z } from 'zod'

// Request validation schema
const QueryParamsSchema = z.object({
  debug: z.enum(['true', 'false']).optional(),
  format: z.enum(['redirect', 'json', 'jwt']).optional().default('redirect'),
  test: z.enum(['true', 'false']).optional()
})

// Response interfaces
interface GoogleWalletResponse {
  success: boolean
  data?: {
    saveUrl: string
    classId: string
    objectId: string
    jwt?: string
  }
  debug?: any
  error?: string
  metadata?: {
    cardType: 'stamp' | 'membership'
    businessId: string
    customerId: string
    timestamp: string
    environment: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  const startTime = Date.now()
  
  try {
    const { customerCardId } = await params
    const url = new URL(request.url)
    const queryParams = QueryParamsSchema.parse({
      debug: url.searchParams.get('debug') || undefined,
      format: url.searchParams.get('format') || 'redirect',
      test: url.searchParams.get('test') || undefined
    })

    // Initialize services
    const supabase = await createServerClient()
    const adminClient = createAdminClient()
    const walletBuilder = new EnhancedGoogleWalletBuilder()

    // Validate Google Wallet configuration
    const healthStatus = await walletBuilder.getHealthStatus()
    if (healthStatus.status === 'unhealthy') {
      return NextResponse.json({
        success: false,
        error: 'Google Wallet service is not properly configured',
        debug: queryParams.debug === 'true' ? healthStatus.details : undefined
      } as GoogleWalletResponse, { status: 503 })
    }

    // Validate production readiness if in production
    if (process.env.NODE_ENV === 'production') {
      const readinessCheck = walletBuilder.validateProductionReadiness()
      if (!readinessCheck.isReady) {
        return NextResponse.json({
          success: false,
          error: 'Google Wallet is not production ready',
          debug: queryParams.debug === 'true' ? readinessCheck : undefined
        } as GoogleWalletResponse, { status: 503 })
      }
    }

    if (!customerCardId) {
      return NextResponse.json({
        success: false,
        error: 'Customer card ID is required'
      } as GoogleWalletResponse, { status: 400 })
    }

    // Fetch customer card with all related data
    const { data: customerCard, error: cardError } = await adminClient
      .from('customer_cards')
      .select(`
        id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        expiry_date,
        created_at,
        updated_at,
        wallet_type,
        stamp_card:stamp_cards(
          id,
          card_name,
          card_color,
          icon_emoji,
          total_stamps,
          stamps_required,
          reward,
          reward_description,
          barcode_type,
          card_expiry_days,
          reward_expiry_days,
          how_to_earn_stamp,
          earned_stamp_message,
          earned_reward_message,
          business_id
        ),
        membership_card:membership_cards(
          id,
          name,
          card_color,
          icon_emoji,
          total_sessions,
          cost,
          membership_type,
          membership_mode,
          barcode_type,
          card_expiry_days,
          card_description,
          how_to_use_card,
          membership_details,
          session_used_message,
          membership_expired_message,
          business_id
        ),
        customer:customers(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (cardError || !customerCard) {
      return NextResponse.json({
        success: false,
        error: 'Customer card not found',
        debug: queryParams.debug === 'true' ? { cardError, customerCardId } : undefined
      } as GoogleWalletResponse, { status: 404 })
    }

    // Determine card type
    const isStampCard = !!customerCard.stamp_card_id
    const isMembershipCard = !!customerCard.membership_card_id

    if (!isStampCard && !isMembershipCard) {
      return NextResponse.json({
        success: false,
        error: 'Invalid customer card: no card type found'
      } as GoogleWalletResponse, { status: 400 })
    }

    const cardType: 'stamp' | 'membership' = isStampCard ? 'stamp' : 'membership'
    const cardData = isStampCard ? customerCard.stamp_card : customerCard.membership_card

    if (!cardData) {
      return NextResponse.json({
        success: false,
        error: `${cardType} card data not found`
      } as GoogleWalletResponse, { status: 404 })
    }

    // Fetch business data
    const { data: businessData, error: businessError } = await adminClient
      .from('businesses')
      .select('*')
      .eq('id', cardData.business_id)
      .single()

    if (businessError || !businessData) {
      return NextResponse.json({
        success: false,
        error: 'Business not found',
        debug: queryParams.debug === 'true' ? { businessError, businessId: cardData.business_id } : undefined
      } as GoogleWalletResponse, { status: 404 })
    }

    // Prepare pass data
    const passData: GoogleWalletPassData = {
      customerCard: {
        ...customerCard,
        [cardType === 'stamp' ? 'stamp_card' : 'membership_card']: cardData
      } as any,
      business: businessData,
      cardType
    }

    // Handle test mode
    if (queryParams.test === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          saveUrl: 'https://pay.google.com/gp/v/save/TEST_JWT_TOKEN',
          classId: `test_issuer.test_class_${cardType}`,
          objectId: `test_issuer.test_class_${cardType}.${customerCardId.replace(/-/g, '')}`,
          jwt: 'TEST_JWT_TOKEN'
        },
        metadata: {
          cardType,
          businessId: businessData.id,
          customerId: customerCard.customer?.id || 'unknown',
          timestamp: new Date().toISOString(),
          environment: 'test'
        }
      } as GoogleWalletResponse)
    }

    // Create Google Wallet pass
    const passResult = await walletBuilder.createCompletePass(passData)

    // Log wallet generation event (for analytics)
    await adminClient
      .from('card_events')
      .insert({
        card_id: customerCardId,
        event_type: 'google_wallet_generated',
        metadata: {
          classId: passResult.classId,
          objectId: passResult.objectId,
          businessId: businessData.id,
          cardType,
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      })
      .single()

    // Update wallet provisioning status
    await adminClient
      .from('wallet_provisioning_status')
      .upsert({
        card_id: customerCardId,
        google_status: 'provisioned',
        last_updated: new Date().toISOString(),
        metadata: {
          classId: passResult.classId,
          objectId: passResult.objectId,
          lastGenerated: new Date().toISOString()
        }
      })

    const response: GoogleWalletResponse = {
      success: true,
      data: {
        saveUrl: passResult.saveUrl,
        classId: passResult.classId,
        objectId: passResult.objectId,
        ...(queryParams.format === 'jwt' && { jwt: passResult.jwt })
      },
      metadata: {
        cardType,
        businessId: businessData.id,
        customerId: customerCard.customer?.id || 'unknown',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    }

    // Add debug information if requested
    if (queryParams.debug === 'true') {
      response.debug = {
        customerCard: {
          id: customerCard.id,
          type: cardType,
          current_stamps: customerCard.current_stamps,
          sessions_used: customerCard.sessions_used,
          expiry_date: customerCard.expiry_date
        },
        business: {
          id: businessData.id,
          name: businessData.name,
          location: businessData.formatted_address
        },
        googleWallet: {
          classId: passResult.classId,
          objectId: passResult.objectId,
          health: healthStatus,
          processingTime: Date.now() - startTime
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasGoogleConfig: !!(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL && 
                              process.env.GOOGLE_WALLET_PRIVATE_KEY && 
                              process.env.GOOGLE_WALLET_ISSUER_ID)
        }
      }
    }

    // Handle different response formats
    switch (queryParams.format) {
      case 'json':
        return NextResponse.json(response)
      
      case 'jwt':
        return NextResponse.json(response)
      
      case 'redirect':
      default:
        // Redirect to Google Wallet save URL
        return NextResponse.redirect(passResult.saveUrl)
    }

  } catch (error) {
    console.error('Enhanced Google Wallet API error:', error)
    
    // Log error event
    try {
      const adminClient = createAdminClient()
      await adminClient
        .from('card_events')
        .insert({
          card_id: (await params).customerCardId,
          event_type: 'google_wallet_error',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            userAgent: request.headers.get('user-agent')
          }
        })
        .single()
    } catch (logError) {
      console.error('Failed to log error event:', logError)
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate Google Wallet pass',
      debug: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    } as GoogleWalletResponse, { status: 500 })
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const walletBuilder = new EnhancedGoogleWalletBuilder()
    const healthStatus = await walletBuilder.getHealthStatus()
    
    return new NextResponse(null, {
      status: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'X-Service-Status': healthStatus.status,
        'X-Environment': process.env.NODE_ENV || 'development',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Service-Status': 'unhealthy',
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}