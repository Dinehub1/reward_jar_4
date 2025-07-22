/**
 * RewardJar 4.0 - Google Wallet API Route
 * Generates Google Wallet passes for loyalty cards (stamp & membership subtypes)
 * 
 * @version 4.0
 * @path /api/wallet/google/[customerCardId]
 * @created July 21, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase-server'
import QRCode from 'qrcode'

// Disable all caching - generate fresh tokens every time
// No JWT cache - always generate fresh tokens

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    // Await params as required by Next.js 15.3.5
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId
    
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get('debug') === 'true'
    const cardType = searchParams.get('type') || 'loyalty'
    const timestamp = Date.now()
    
    console.log(`🎫 Generating Google Wallet pass for card: ${customerCardId}`)
    
    // Create unique card ID with timestamp to bypass all caching
    const uniqueCardId = `${customerCardId}_${timestamp}`
    
    // Get card data from database
    const supabase = createServiceClient()
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        membership_type,
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
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('❌ Customer card not found:', error)
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 })
    }

    const isStampCard = customerCard.membership_type === 'loyalty'
    const isMembershipCard = customerCard.membership_type === 'gym'
    
    // Determine card type and title - CRITICAL: Use exact strings that will override class
    const cardTypeDisplay = isStampCard ? 'Stamp Cards' : 'Membership Cards'
    const cardTypeMessage = isStampCard ? 'Collect stamps to earn rewards' : 'Track your membership sessions'
    
    console.log(`📋 Card type detected: ${cardTypeDisplay}`)
    console.log(`🏷️ Setting Google Wallet title to: "${cardTypeDisplay}"`)

    // Dynamic class ID based on card type - Use v2 classes with correct programName
  const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
    const dynamicClassId = isStampCard 
      ? `${issuerID}.loyalty.rewardjar_v2`
      : `${issuerID}.membership.rewardjar_v2`

    // Calculate progress and status
    let progress = 0
    let statusText = ''
    let pointsLabel = ''
    let pointsValue = ''
    
    if (isStampCard) {
      const stampCard = Array.isArray(customerCard.stamp_cards) ? customerCard.stamp_cards[0] : customerCard.stamp_cards
      const totalStamps = stampCard?.total_stamps || 10
      progress = Math.round((customerCard.current_stamps / totalStamps) * 100)
      statusText = customerCard.current_stamps >= totalStamps 
        ? 'Reward ready to claim!' 
        : `${totalStamps - customerCard.current_stamps} stamps needed for reward`
      pointsLabel = 'Stamps Collected'
      pointsValue = `${customerCard.current_stamps}/${totalStamps}`
    } else {
      const totalSessions = customerCard.total_sessions || 20
      progress = Math.round((customerCard.sessions_used / totalSessions) * 100)
      statusText = `${totalSessions - customerCard.sessions_used} sessions remaining`
      pointsLabel = 'Sessions Used'
      pointsValue = `${customerCard.sessions_used}/${totalSessions}`
    }

    // Generate QR code
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const cardAccessUrl = `${baseUrl}/customer/card/${customerCardId}`
    
    const qrCodeDataURL = await QRCode.toDataURL(cardAccessUrl, {
      width: 200,
      margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
      }
    })

    // Create loyalty object with MAXIMUM title override strategy
    const loyaltyObject = {
      id: `${dynamicClassId}.${uniqueCardId}`, // Use unique ID
      classId: dynamicClassId,
      state: 'ACTIVE',
      
      // COMPREHENSIVE TITLE OVERRIDE - Use all possible fields
      localizedIssuerName: {
        defaultValue: {
          language: 'en-US',
          value: cardTypeDisplay
        }
      },
      localizedTitle: {
        defaultValue: {
          language: 'en-US', 
          value: cardTypeDisplay
        }
      },
      header: cardTypeDisplay, // Direct string override
      localizedHeader: {
        defaultValue: {
          language: 'en-US',
          value: cardTypeDisplay
        }
      },
      title: cardTypeDisplay, // Direct string override
      
      // Message-based title override
      messages: [{
        header: cardTypeDisplay,
        body: cardTypeMessage,
        id: `title_override_${timestamp}`,
        messageType: 'TEXT'
      }],
      
      // Additional override attempts
      issuerName: cardTypeDisplay,
      programName: cardTypeDisplay,
      
      // Account information
      accountId: uniqueCardId,
      accountName: ((customerCard.customers as any)?.[0]?.name || (customerCard.customers as any)?.name) || `Customer ${customerCardId.substring(0, 8)}`,
      
      // Loyalty points (stamps or sessions)
      loyaltyPoints: {
        balance: {
          string: pointsValue
        },
        label: pointsLabel
      },
      
      // Secondary points (progress percentage)
      secondaryLoyaltyPoints: {
        balance: {
          string: `${progress}%`
        },
        label: 'Progress'
      },
      
      // QR code
      barcode: {
        type: 'QR_CODE',
        value: customerCardId,
        alternateText: `Card ID: ${customerCardId}`
      },
      
      // Business and reward information
      textModulesData: [
        {
          id: 'business_info',
          header: ((customerCard.stamp_cards as any)?.[0]?.businesses?.[0]?.name || (customerCard.stamp_cards as any)?.businesses?.[0]?.name) || 'Business',
          body: ((customerCard.stamp_cards as any)?.[0]?.businesses?.[0]?.description || (customerCard.stamp_cards as any)?.businesses?.[0]?.description) || 'Visit us to collect stamps and earn rewards!'
        },
        {
          id: 'reward_info',
          header: isStampCard ? 'Your Reward' : 'Membership Benefits',
          body: ((customerCard.stamp_cards as any)?.[0]?.reward_description || (customerCard.stamp_cards as any)?.reward_description) || 'Complete your card to unlock rewards!'
        },
        {
          id: 'status',
          header: 'Status',
          body: statusText
        }
      ],
      
      // Visual styling based on card type
      hexBackgroundColor: isStampCard ? '#10b981' : '#6366f1',
      
      // Validity period
      validTimeInterval: {
        startTime: new Date().toISOString(),
        ...(isMembershipCard && customerCard.expiry_date ? { endTime: customerCard.expiry_date } : {})
      }
    }

    // Add membership-specific fields
    if (isMembershipCard) {
      loyaltyObject.textModulesData.push({
        id: 'membership_value',
        header: 'Membership Value',
        body: `₩${customerCard.cost?.toLocaleString() || '15,000'} membership`
      })
      
      if (customerCard.expiry_date) {
        loyaltyObject.validTimeInterval.endTime = customerCard.expiry_date
      }
    }

      console.log('🔐 Signing JWT with RS256 algorithm for Google Wallet')
    console.log('🔍 Processing private key format...')

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      throw new Error('Google Service Account private key not found')
    }

    // Use the exact same private key processing as the working class route
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    
    // Handle different newline formats
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    
    // Remove any surrounding quotes that might be present
    privateKey = privateKey.replace(/^["']|["']$/g, '')
    
    // Ensure proper line endings for PEM format
    if (!privateKey.includes('\n')) {
      // If no newlines, try to detect and add them after header/footer
      privateKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
    }

    // Validate PEM format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - must be PEM format')
    }

    console.log('✅ Private key validated successfully')
    console.log('🔐 Signing JWT with RS256...')

    // Create JWT payload - ALWAYS generate fresh token
    const jwtPayload = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      
    payload: {
      loyaltyObjects: [loyaltyObject]
    }
  }

    // Sign JWT with RS256
    const token = jwt.sign(jwtPayload, privateKey, {
      algorithm: 'RS256'
    })
    
    console.log('✅ JWT signed successfully')

    // Generate save URL
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`

    if (debug) {
      return NextResponse.json({
        success: true,
        loyaltyObject,
        jwtPayload,
        saveUrl,
        cardType: cardTypeDisplay,
        uniqueId: uniqueCardId,
        timestamp
      })
    }

    // Return HTML page with the save URL
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add to Google Wallet - ${cardTypeDisplay}</title>
    <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
            }
            .logo {
                width: 60px;
                height: 60px;
                background: #4285f4;
                border-radius: 12px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 24px;
            }
            .subtitle {
                color: #666;
                margin-bottom: 30px;
                font-size: 16px;
            }
            .wallet-button {
                background: #000;
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
                margin-bottom: 20px;
            }
            .wallet-button:hover {
                background: #333;
                transform: translateY(-2px);
            }
            .info {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 16px;
                margin-top: 20px;
                font-size: 14px;
                color: #666;
            }
            .card-type {
                color: #4285f4;
                font-weight: 600;
                font-size: 18px;
                margin-bottom: 10px;
        }
    </style>
</head>
    <body>
        <div class="container">
            <div class="logo">G</div>
            <div class="card-type">${cardTypeDisplay}</div>
            <h1>Add to Google Wallet</h1>
            <p class="subtitle">Your ${cardTypeDisplay.toLowerCase()} is ready to be added to Google Wallet</p>
            
            <a href="${saveUrl}" class="wallet-button" target="_blank">
                Add to Google Wallet
            </a>
            
            <div class="info">
                <strong>Card Type:</strong> ${cardTypeDisplay}<br>
                <strong>Progress:</strong> ${pointsValue} (${progress}%)<br>
                <strong>Status:</strong> ${statusText}<br>
                <strong>Generated:</strong> ${new Date().toLocaleString()}
            </div>
        </div>
        
        <script>
            // Auto-redirect after 2 seconds if on mobile
            if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                setTimeout(() => {
                    window.location.href = "${saveUrl}";
                }, 2000);
            }
        </script>
</body>
    </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('❌ Google Wallet generation failed:', error)
    return NextResponse.json({
      error: 'Failed to generate Google Wallet pass',
      details: error.message,
      timestamp: new Date().toISOString()
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
  const customerCardId = resolvedParams.customerCardId
    const url = new URL(request.url)
    const requestedType = url.searchParams.get('type') // 'stamp' or 'membership'

    console.log('🎯 POST: Google Wallet API called for customer card:', customerCardId, 'type:', requestedType)

    // Check required environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Missing Google Wallet configuration' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get customer card with stamp card details and membership info
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        created_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('Customer card not found:', error)
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    console.log('📊 Customer card data:', {
      id: customerCard.id,
      membership_type: customerCard.membership_type,
      current_stamps: customerCard.current_stamps,
      sessions_used: customerCard.sessions_used,
      total_sessions: customerCard.total_sessions
    })

    // Determine card type - either from query param or database
    let cardType = requestedType
    if (!cardType) {
      // Auto-detect from database if not specified
      cardType = customerCard.membership_type === 'loyalty' ? 'stamp' : 'membership'
    }

    // Validate card type compatibility
    if (cardType === 'stamp' && customerCard.membership_type !== 'loyalty') {
      return NextResponse.json(
        { error: 'Card type mismatch: requested stamp card but database shows membership type' },
        { status: 400 }
      )
    }
    if (cardType === 'membership' && customerCard.membership_type !== 'membership') {
      return NextResponse.json(
        { error: 'Card type mismatch: requested membership card but database shows loyalty type' },
        { status: 400 }
      )
    }

    // Clean the private key - Fix RS256 signing
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    privateKey = privateKey.replace(/^[\"\']|[\"\']$/g, '') // Remove surrounding quotes
    
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return NextResponse.json(
        { error: 'Invalid Google Service Account private key format' },
        { status: 400 }
      )
    }

    // Create Google Wallet object based on card type
    const timestamp = Date.now()
    const uniqueCardId = `${customerCardId}_${timestamp}`
    
    // Dynamic class ID based on card type - Use v2 classes with correct programName
    const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
    
    let walletObject
    let dynamicClassId
    let cardTypeDisplay
    let cardTypeMessage

    if (cardType === 'stamp') {
      // STAMP CARD (Loyalty) - Green theme with stamp collection
      dynamicClassId = `${issuerID}.loyalty.rewardjar_v2`
      cardTypeDisplay = 'Stamp Cards'
      cardTypeMessage = 'Collect stamps to earn rewards'

      walletObject = {
        id: `${dynamicClassId}.${uniqueCardId}`,
        classId: dynamicClassId,
        state: 'ACTIVE',
        loyaltyPoints: {
          balance: { 
            string: `${customerCard.current_stamps || 0}/${customerCard.stamp_cards?.[0]?.total_stamps || 10}` 
          },
          label: 'Stamps Collected'
        },
        secondaryLoyaltyPoints: {
          balance: { 
            string: `${Math.round(((customerCard.current_stamps || 0) / (customerCard.stamp_cards?.[0]?.total_stamps || 10)) * 100)}%` 
          },
          label: 'Progress'
        },
        hexBackgroundColor: '#10b981', // Green theme for stamp cards
        validTimeInterval: {
          startTime: new Date().toISOString()
        }
      }
    } else {
      // MEMBERSHIP CARD - Indigo theme with session tracking
      dynamicClassId = `${issuerID}.membership.rewardjar_v2`
      cardTypeDisplay = 'Membership Cards'
      cardTypeMessage = 'Track your membership sessions'

      const textModulesData = []
      if (customerCard.expiry_date) {
        textModulesData.push({
          header: 'Expires',
          body: new Date(customerCard.expiry_date).toLocaleDateString(),
          id: 'expiry_date'
        })
      }
      if (customerCard.cost) {
        textModulesData.push({
          header: 'Cost',
          body: `₩${customerCard.cost.toLocaleString()}`,
          id: 'membership_cost'
        })
      }

      walletObject = {
        id: `${dynamicClassId}.${uniqueCardId}`,
        classId: dynamicClassId,
        state: 'ACTIVE',
        loyaltyPoints: {
          balance: { 
            string: `${customerCard.sessions_used || 0}/${customerCard.total_sessions || 20}` 
          },
          label: 'Sessions Used'
        },
        secondaryLoyaltyPoints: {
          balance: { 
            string: `${Math.round(((customerCard.sessions_used || 0) / (customerCard.total_sessions || 20)) * 100)}%` 
          },
          label: 'Progress'
        },
        hexBackgroundColor: '#6366f1', // Indigo theme for membership cards
        textModulesData,
        validTimeInterval: {
          startTime: new Date().toISOString(),
          endTime: customerCard.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }

    // Create JWT payload
    const jwtPayload = {
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        loyaltyObjects: [walletObject]
      }
    }

    console.log('🔐 JWT payload created for', cardType, 'card:', {
      classId: walletObject.classId,
      balance: walletObject.loyaltyPoints?.balance?.string,
      color: walletObject.hexBackgroundColor
    })

    // Sign JWT with RS256
    const token = jwt.sign(jwtPayload, privateKey, { algorithm: 'RS256' })
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`
    
    return NextResponse.json(
      { 
        success: true,
        saveUrl,
        cardType,
        loyaltyObject: walletObject,
        message: `Google Wallet ${cardType} card generated successfully`
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, max-age=1'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error in Google Wallet POST API:', error)
    
    // Handle specific RS256 errors
    if (error instanceof Error && error.message.includes('RS256')) {
      return NextResponse.json(
        { error: 'Google Service Account private key configuration error' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate Google Wallet pass' },
      { status: 500 }
    )
  }
} 