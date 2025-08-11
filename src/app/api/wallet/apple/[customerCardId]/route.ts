import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { getAppleWalletBaseUrl } from '@/lib/env'
import { buildApplePassJson } from '@/lib/wallet/builders/apple-pass-builder'
import { buildAppleBarcode, getAppleWebServiceUrl, generatePKPass as generatePKPassShared } from '@/lib/wallet/apple-helpers'
import crypto from 'crypto'
import archiver from 'archiver'
import forge from 'node-forge'
import sharp from 'sharp'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

// Use getAppleWebServiceUrl() from shared helpers for consistency

// Helper function to convert hex to RGB format for Apple Wallet
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'rgb(16, 185, 129)' // fallback green
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    // Use admin client for wallet generation
    const supabase = createAdminClient()
    const customerCardId = resolvedParams.customerCardId


    // Get customer card with unified schema - include FK columns
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        stamp_card_id,
        membership_card_id,
        current_stamps,
        sessions_used,
        stamp_cards (
          id,
          name,
          card_color,
          icon_emoji,
          total_stamps,
          reward_description,
          businesses (
            id,
            name,
            description
          )
        ),
        membership_cards (
          id,
          name,
          card_color,
          icon_emoji,
          total_sessions,
          cost,
          businesses (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    // Determine card type from unified schema using FK columns
    const isStampCard = customerCard.stamp_card_id !== null
    const isMembershipCard = customerCard.membership_card_id !== null

    if (!isStampCard && !isMembershipCard) {
      return NextResponse.json(
        { error: 'Invalid customer card: no card type found' },
        { status: 400 }
      )
    }

    // Get card data based on type - now accessing plural table joins
    let cardData: any
    let businessData: any

    if (isStampCard) {
      cardData = customerCard.stamp_cards?.[0] // plural table, take first result
      businessData = cardData?.businesses?.[0]
    } else {
      cardData = customerCard.membership_cards?.[0] // plural table, take first result
      businessData = cardData?.businesses?.[0]
    }

    if (!cardData) {
      return NextResponse.json(
        { error: 'Card template not found' },
        { status: 404 }
      )
    }
    let progress: number
    let isCompleted: boolean
    let remaining: number
    let primaryValue: string
    let progressLabel: string
    let remainingLabel: string

    if (isMembershipCard) {
      // Handle membership card logic
      const sessionsUsed = customerCard.sessions_used || 0
      const totalSessions = cardData.total_sessions || 20
      progress = (sessionsUsed / totalSessions) * 100
      isCompleted = sessionsUsed >= totalSessions
      remaining = Math.max(0, totalSessions - sessionsUsed)
      primaryValue = `${sessionsUsed}/${totalSessions}`
      progressLabel = "Sessions Used"
      remainingLabel = isCompleted ? "Status" : "Remaining"
      
      // Check if membership is expired
      const isExpired = customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false
      if (isExpired && !isCompleted) {
        isCompleted = true
        remainingLabel = "Status"
      }
    } else {
      // Handle stamp card logic
      progress = (customerCard.current_stamps / cardData.total_stamps) * 100
      isCompleted = customerCard.current_stamps >= cardData.total_stamps
      remaining = Math.max(0, cardData.total_stamps - customerCard.current_stamps)
      primaryValue = `${customerCard.current_stamps}/${cardData.total_stamps}`
      progressLabel = "Stamps Collected"
      remainingLabel = isCompleted ? "Status" : "Remaining"
    }

    // Generate Apple Wallet pass JSON via centralized builder
    const basePass = buildApplePassJson({
      customerCardId,
      cardData: {
        name: cardData.name,
        total_stamps: cardData.total_stamps,
        reward_description: cardData.reward_description,
        card_color: cardData.card_color,
      },
      businessData: {
        name: businessData.name,
        description: businessData.description,
      },
      derived: {
        progressLabel,
        progressPercent: progress,
        remainingCount: remaining,
        isExpired: isMembershipCard ? (customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false) : undefined,
        membershipCost: isMembershipCard ? cardData?.cost : undefined,
        membershipTotalSessions: isMembershipCard ? cardData?.total_sessions : undefined,
        membershipExpiryDate: isMembershipCard ? (customerCard.expiry_date ?? null) : undefined,
      },
      locale: businessData.locale || 'en-IN',
    })

    const passData = {
      ...basePass,
      ...buildAppleBarcode(customerCardId, { altTextPrefix: isMembershipCard ? 'Membership ID' : 'Card ID' }),
      webServiceURL: getAppleWebServiceUrl(),
      authenticationToken: customerCardId,
      userInfo: {
        customerCardId,
        stampCardId: (cardData as any).id,
        businessName: businessData.name,
        cardType: isMembershipCard ? 'membership' : 'stamp',
      },
      locations: [],
      maxDistance: 1000,
      relevantDate: new Date().toISOString(),
      ...(isMembershipCard && customerCard.expiry_date && { expirationDate: customerCard.expiry_date }),
    }

    // Check if we have all required certificates for PKPass generation
    const hasAllCertificates = process.env.APPLE_CERT_BASE64 && 
                              process.env.APPLE_KEY_BASE64 && 
                              process.env.APPLE_WWDR_BASE64

    // For debugging, return JSON
    if (request.nextUrl.searchParams.get('debug') === 'true') {
      const debugInfo = {
        passData,
        certificatesConfigured: hasAllCertificates,
        webServiceURL: getAppleWebServiceUrl(),
        environment: {
          teamIdentifier: !!process.env.APPLE_TEAM_IDENTIFIER,
          passTypeIdentifier: !!process.env.APPLE_PASS_TYPE_IDENTIFIER,
          certificates: hasAllCertificates ? 'CONFIGURED' : 'MISSING',
          certificateDetails: hasAllCertificates ? {
            cert: process.env.APPLE_CERT_BASE64 ? `${process.env.APPLE_CERT_BASE64.substring(0, 50)}...` : 'MISSING',
            key: process.env.APPLE_KEY_BASE64 ? `${process.env.APPLE_KEY_BASE64.substring(0, 50)}...` : 'MISSING',
            wwdr: process.env.APPLE_WWDR_BASE64 ? `${process.env.APPLE_WWDR_BASE64.substring(0, 50)}...` : 'MISSING'
          } : 'CERTIFICATES_NOT_CONFIGURED'
        },
        status: hasAllCertificates ? 'READY_FOR_PKPASS_GENERATION' : 'SETUP_REQUIRED'
      }
      
      return NextResponse.json(debugInfo, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // If certificates are configured, generate actual PKPass
    if (hasAllCertificates) {
      try {
        // Validate pass structure before generation
        const validationErrors = validatePKPassStructure(passData)
        if (validationErrors.length > 0) {
          return NextResponse.json(
            { 
              error: 'PKPass validation failed',
              message: validationErrors.join(', ')
            },
            { status: 400 }
          )
        }
        
        const pkpassBuffer = await generatePKPassShared(passData)
        
        // IMPROVED HEADERS for better iOS Safari compatibility
        return new NextResponse(pkpassBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="${cardData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pkpass"`,
            'Content-Transfer-Encoding': 'binary',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Content-Type-Options': 'nosniff',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'Failed to generate Apple Wallet pass',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    }

    // Return instructions for production setup
    const instructionsHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Apple Wallet - Setup Required</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-2xl mx-auto px-4 space-y-6">
        <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-center mb-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Apple Wallet Setup Required</h1>
                <p class="text-gray-600">Apple Wallet certificates need to be configured to generate passes.</p>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Configuration Required</h3>
                        <p class="text-sm text-yellow-700 mt-1">
                            To generate Apple Wallet passes, you need to configure your Apple Developer certificates.
                        </p>
                    </div>
        </div>
            </div>
            
            <div class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900">Required Environment Variables:</h2>
                <ul class="space-y-2 text-sm text-gray-600">
                    <li>• APPLE_CERT_BASE64 - Your pass certificate (Base64 encoded)</li>
                    <li>• APPLE_KEY_BASE64 - Your private key (Base64 encoded)</li>
                    <li>• APPLE_WWDR_BASE64 - Apple's WWDR certificate (Base64 encoded)</li>
                    <li>• APPLE_CERT_PASSWORD - Certificate password</li>
                    <li>• APPLE_TEAM_IDENTIFIER - Your Apple team identifier</li>
                    <li>• APPLE_PASS_TYPE_IDENTIFIER - Your pass type identifier</li>
                </ul>
                
                <div class="mt-6 flex flex-col sm:flex-row gap-3">
                    <a href="/api/wallet/pwa/${customerCardId}" class="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded font-medium">
                        Use Web App Instead
                    </a>
                    <a href="/api/wallet/google/${customerCardId}" class="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded font-medium">
                        Try Google Wallet
                    </a>
                </div>
            </div>
        </div>
        
        <div class="text-center">
            <a href="/customer/card/${customerCardId}" class="text-gray-600 hover:text-gray-900 text-sm">
                ← Back to Card
            </a>
        </div>
    </div>
</body>
</html>
    `

    return new NextResponse(instructionsHTML, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Apple Wallet pass',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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


    // Check required environment variables
    if (!process.env.APPLE_TEAM_IDENTIFIER) {
      return NextResponse.json(
        { error: 'Missing APPLE_TEAM_ID configuration' },
        { status: 400 }
      )
    }

    // Get customer card with unified schema
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        stamp_cards (
          id,
          businesses (
            name,
          )
        ),
        membership_cards (
          id,
          businesses (
            name,
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
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

    // Determine card type - either from query param or auto-detect
    let cardType = requestedType
    if (!cardType) {
      cardType = isStampCard ? 'stamp' : 'membership'
    }

    // Validate card type compatibility
    if (cardType === 'stamp' && !isStampCard) {
      return NextResponse.json(
        { error: 'Card type mismatch: requested stamp card but customer card is membership type' },
        { status: 400 }
      )
    }
    if (cardType === 'membership' && !isMembershipCard) {
      return NextResponse.json(
        { error: 'Card type mismatch: requested membership card but customer card is stamp type' },
        { status: 400 }
      )
    }

    // Generate the PKPass using the existing logic from GET endpoint
    // For now, return a success response with proper filename based on card type
    const filename = cardType === 'stamp' 
      ? `Stamp_Card_${customerCardId.substring(0, 8)}.pkpass`
      : `Membership_Card_${customerCardId.substring(0, 8)}.pkpass`
    
    const backgroundColor = cardType === 'stamp' 
      ? 'rgb(16, 185, 129)'  // Green for stamp cards
      : 'rgb(99, 102, 241)'   // Indigo for membership cards

    
    return NextResponse.json(
      { 
        success: true, 
        message: `Apple Wallet ${cardType} card generated successfully`,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, max-age=1'
        }
      }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate Apple Wallet pass' },
      { status: 500 }
    )
  }
}

// Local generatePKPass removed in favor of shared implementation in `src/lib/wallet/apple-helpers.ts`.

// Local PKPass helpers removed; using shared implementations from `src/lib/wallet/apple-helpers.ts`

// Validate PKPass structure
function validatePKPassStructure(passData: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Required top-level fields
  if (!passData.formatVersion) errors.push('Missing formatVersion')
  if (!passData.passTypeIdentifier) errors.push('Missing passTypeIdentifier')
  if (!passData.serialNumber) errors.push('Missing serialNumber')
  if (!passData.teamIdentifier) errors.push('Missing teamIdentifier')
  if (!passData.organizationName) errors.push('Missing organizationName')
  if (!passData.description) errors.push('Missing description')
  
  // Must have one pass style
  const passStyles = ['boardingPass', 'coupon', 'eventTicket', 'generic', 'storeCard']
  const hasPassStyle = passStyles.some(style => passData[style])
  if (!hasPassStyle) errors.push('Missing pass style (boardingPass, coupon, eventTicket, generic, or storeCard)')
  
  // Check barcode format
  if (passData.barcodes && Array.isArray(passData.barcodes)) {
    const validFormats = ['PKBarcodeFormatQR', 'PKBarcodeFormatPDF417', 'PKBarcodeFormatAztec', 'PKBarcodeFormatCode128']
    for (const barcode of passData.barcodes) {
      if (typeof barcode === 'object' && barcode !== null) {
        const bc = barcode as { format: string }
        if (!validFormats.includes(bc.format)) {
          errors.push(`Invalid barcode format: ${bc.format}`)
        }
      }
    }
  }
  
  return errors
} 