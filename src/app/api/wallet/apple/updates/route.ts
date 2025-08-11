import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getServerUser, getServerSession } from '@/lib/supabase/server'
import { buildApplePass } from '@/lib/wallet/builders/apple-pass-builder'
import { buildAppleBarcode, getAppleWebServiceUrl } from '@/lib/wallet/apple-helpers'

// Apple Wallet Update Service
// This endpoint handles Apple Wallet pass updates when data changes
// Reference: https://developer.apple.com/documentation/walletpasses/updating_a_pass

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Parse the request body (Apple sends pass identifiers)
    const body = await request.json()
    const { passTypeIdentifier, serialNumber } = body


    // Validate authentication token (should match customer card ID)
    const authToken = request.headers.get('Authorization')?.replace('ApplePass ', '')
    
    if (!authToken || authToken !== serialNumber) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get customer card with updated_at timestamp
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        created_at,
        updated_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          updated_at,
          businesses (
            name,
            description,
            updated_at
          )
        ),
        customers (
          name,
          email,
          updated_at
        )
      `)
      .eq('id', serialNumber)
      .single()

    if (error || !customerCard) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    // Check if pass has been updated since last sync
    const lastModified = new Date(customerCard.updated_at).toUTCString()
    const ifModifiedSince = request.headers.get('If-Modified-Since')
    
    if (ifModifiedSince) {
      const lastSyncTime = new Date(ifModifiedSince)
      const lastUpdateTime = new Date(customerCard.updated_at)
      
      if (lastUpdateTime <= lastSyncTime) {
        return new NextResponse(null, { status: 304 })
      }
    }

    // Handle the data structure properly
    const stampCardData = (customerCard.stamp_cards as unknown) as {
      id: string
      name: string
      total_stamps: number
      reward_description: string
      updated_at: string
      businesses: {
        name: string
        description: string
        updated_at: string
      }
    }

    const businessData = stampCardData.businesses as {
      name: string
      description: string
      updated_at: string
    }

    const customerData = (customerCard.customers as unknown) as {
      name: string
      email: string
      updated_at: string
    }

    // Calculate progress
    const progress = Math.min((customerCard.current_stamps / stampCardData.total_stamps) * 100, 100)
    const isCompleted = customerCard.current_stamps >= stampCardData.total_stamps
    const stampsRemaining = Math.max(stampCardData.total_stamps - customerCard.current_stamps, 0)

    // Generate updated pass data using centralized builder
    const basePass = buildApplePass(
      {
        name: stampCardData.name,
        total_stamps: stampCardData.total_stamps,
        reward_description: stampCardData.reward_description,
      },
      { name: businessData.name, description: businessData.description },
      serialNumber,
      {
        type: 'stamp',
        derived: {
          progressLabel: 'Stamps Collected',
          remainingLabel: isCompleted ? 'Status' : 'Remaining',
          primaryValue: `${customerCard.current_stamps}/${stampCardData.total_stamps}`,
          progressPercent: progress,
          remainingCount: stampsRemaining,
          isCompleted,
        },
      }
    ) as any

    const updatedPassData = {
      ...basePass,
      ...buildAppleBarcode(serialNumber, { altTextPrefix: 'Card ID' }),
      webServiceURL: getAppleWebServiceUrl(),
      authenticationToken: serialNumber,
      userInfo: {
        customerCardId: serialNumber,
        stampCardId: stampCardData.id,
        businessName: businessData.name,
        lastUpdated: customerCard.updated_at,
      },
      locations: [],
      maxDistance: 1000,
      relevantDate: new Date().toISOString(),
    }

    // Check if Apple Wallet certificates are configured
    if (!process.env.APPLE_CERT_BASE64 || !process.env.APPLE_KEY_BASE64) {
      return NextResponse.json(
        { error: 'Apple Wallet not configured' },
        { status: 503 }
      )
    }

    // Generate the updated PKPass bundle
    // Note: This would use the same generatePKPass function from the main route
    // For now, return the pass data as JSON for debugging
    const debugMode = request.nextUrl.searchParams.get('debug') === 'true'
    
    if (debugMode) {
      return NextResponse.json({
        message: 'Apple Wallet update endpoint',
        passData: updatedPassData,
        lastModified: lastModified,
        customerCard: {
          id: customerCard.id,
          current_stamps: customerCard.current_stamps,
          updated_at: customerCard.updated_at
        }
      })
    }

    // In production, this would generate and return the actual PKPass file
    // For now, return success response
    return NextResponse.json({
      success: true,
      message: 'Pass updated successfully',
      lastModified: lastModified
    }, {
      headers: {
        'Last-Modified': lastModified,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for Apple Wallet to check for updates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get pass identifiers from query parameters
    const passTypeIdentifier = request.nextUrl.searchParams.get('passTypeIdentifier')
    const serialNumber = request.nextUrl.searchParams.get('serialNumber')
    
    if (!passTypeIdentifier || !serialNumber) {
      return NextResponse.json({ error: 'Missing pass identifiers' }, { status: 400 })
    }

    // Get customer card updated timestamp
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select('id, updated_at')
      .eq('id', serialNumber)
      .single()

    if (error || !customerCard) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    const lastModified = new Date(customerCard.updated_at).toUTCString()
    
    // Check if client has the latest version
    const ifModifiedSince = request.headers.get('If-Modified-Since')
    if (ifModifiedSince) {
      const lastSyncTime = new Date(ifModifiedSince)
      const lastUpdateTime = new Date(customerCard.updated_at)
      
      if (lastUpdateTime <= lastSyncTime) {
        return new NextResponse(null, { status: 304 })
      }
    }

    // Return update available response
    return NextResponse.json({
      updateAvailable: true,
      lastModified: lastModified
    }, {
      headers: {
        'Last-Modified': lastModified
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 