/**
 * RewardJar 4.0 - Google Wallet API Route
 * Generates Google Wallet passes for loyalty cards (stamp & membership subtypes)
 * 
 * @version 4.0
 * @path /api/wallet/google/[customerCardId]
 * @created July 21, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId

    console.log('🎫 Generating Google Wallet pass for card:', customerCardId)

    // Get customer card data with unified schema
    const supabase = createAdminClient()

    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        sessions_used,
        stamp_card_id,
        membership_card_id,
        expiry_date,
        customers!inner (
          id,
          name,
          email
        ),
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
        membership_cards (
          id,
          name,
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
      console.error('❌ Customer card not found:', error)
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 })
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

    // Get card data based on type
    let cardData: any
    let businessData: any

    if (isStampCard) {
      cardData = customerCard.stamp_cards
      businessData = cardData?.businesses
    } else {
      cardData = customerCard.membership_cards
      businessData = cardData?.businesses
    }

    if (!cardData || !businessData) {
      return NextResponse.json(
        { error: 'Card template or business data not found' },
        { status: 404 }
      )
    }

    console.log('✅ Fetched customer card:', {
      id: customerCard.id,
      isStampCard,
      isMembershipCard,
      current_stamps: customerCard.current_stamps,
      sessions_used: customerCard.sessions_used
    })

    // Set appropriate title and theme
    const cardTitle = isMembershipCard ? 'Membership Cards' : 'Stamp Cards'
    
    console.log('🏷️ Setting Google Wallet title to:', `"${cardTitle}"`)

    // Generate Google Wallet class and object IDs
    const classId = isMembershipCard 
      ? `${process.env.GOOGLE_CLASS_ID}.membership.rewardjar`
      : `${process.env.GOOGLE_CLASS_ID}.loyalty.rewardjar`
    
    const objectId = `${classId}.${customerCardId}`

    // Create loyalty object for Google Wallet
    const loyaltyObject = {
      id: objectId,
      classId: classId,
      state: 'ACTIVE',
      heroImage: {
        sourceUri: {
          uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop'
        },
        contentDescription: {
          defaultValue: {
            language: 'en-US',
            value: `${businessData.name} ${cardTitle}`
          }
        }
      },
      textModulesData: [
        {
          id: 'business_name',
          header: 'Business',
          body: businessData.name
        },
        {
          id: 'card_name',
          header: 'Program',
          body: cardData.name
        },
        {
          id: 'reward_description',
          header: isMembershipCard ? 'Benefits' : 'Reward',
          body: isMembershipCard ? `${cardData.total_sessions} sessions for ₩${cardData.cost}` : cardData.reward_description
        }
      ],
      loyaltyPoints: {
        label: isMembershipCard ? 'Sessions Used' : 'Stamps Collected',
        balance: {
          string: isMembershipCard 
            ? `${customerCard.sessions_used || 0}/${cardData.total_sessions || 0}`
            : `${customerCard.current_stamps || 0}/${cardData.total_stamps}`
        }
      },
      accountName: (customerCard.customers as any).name,
      accountId: customerCard.id,
      barcode: {
        type: 'QR_CODE',
        value: `${process.env.NEXT_PUBLIC_BASE_URL}/join/${cardData.id}`,
        alternateText: customerCard.id
      },
      locations: [
        {
          latitude: 37.7749,
          longitude: -122.4194
        }
      ],
      hexBackgroundColor: isMembershipCard ? '#6366f1' : '#10b981', // Indigo for membership, green for stamp
      logoImage: {
        sourceUri: {
          uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop'
        },
        contentDescription: {
          defaultValue: {
            language: 'en-US',
            value: 'Business Logo'
          }
        }
      }
    }

    // JWT payload for Google Wallet
    const payload = {
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      payload: {
        loyaltyObjects: [loyaltyObject]
      }
    }

    console.log('🔐 Signing JWT with RS256 algorithm for Google Wallet')

    // Process private key
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    if (!privateKey) {
      console.error('❌ Google service account private key not found')
      return NextResponse.json({ error: 'Google Wallet configuration error' }, { status: 500 })
    }

    console.log('🔍 Processing private key format...')
    
    // Handle escaped newlines in the private key
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    // Validate private key format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      console.error('❌ Invalid private key format')
      return NextResponse.json({ error: 'Invalid private key format' }, { status: 500 })
    }

    console.log('✅ Private key validated successfully')

    // Sign JWT using crypto module
    const crypto = require('crypto')
    
    console.log('🔐 Signing JWT with RS256...')
    
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signatureInput = `${header}.${payloadStr}`
    
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), privateKey).toString('base64url')
    const jwt = `${signatureInput}.${signature}`

    console.log('✅ JWT signed successfully')

    // Generate Google Wallet save URL
    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`

    // Return HTML page with Google Wallet integration
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add to Google Wallet - ${(customerCard.stamp_cards as any).name}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, ${isGymMembership ? '#6366f1' : '#10b981'} 0%, ${isGymMembership ? '#4f46e5' : '#059669'} 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            h1 {
                color: #1f2937;
                margin-bottom: 10px;
                font-size: 24px;
            }
            .business-name {
                color: #6b7280;
                margin-bottom: 20px;
                font-size: 16px;
            }
            .progress {
                background: #f3f4f6;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                font-size: 18px;
                font-weight: bold;
                color: ${isGymMembership ? '#6366f1' : '#10b981'};
            }
            .google-wallet-button {
                background: #4285f4;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: background-color 0.2s;
            }
            .google-wallet-button:hover {
                background: #3367d6;
            }
            .info {
                color: #6b7280;
                font-size: 14px;
                margin-top: 20px;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">${isGymMembership ? '🏋️‍♂️' : '☕'}</div>
            <h1>${(customerCard.stamp_cards as any).name}</h1>
            <div class="business-name">${(customerCard.stamp_cards as any).businesses.name}</div>
            
            <div class="progress">
                ${isGymMembership 
                  ? `${customerCard.sessions_used || 0}/${customerCard.total_sessions || 0} sessions used`
                  : `${customerCard.current_stamps || 0}/${(customerCard.stamp_cards as any).total_stamps} stamps collected`
                }
            </div>
            
            <a href="${saveUrl}" class="google-wallet-button">
                📱 Add to Google Wallet
            </a>
            
            <div class="info">
                ${isGymMembership 
                  ? 'Track your membership sessions and benefits with Google Wallet.'
                  : 'Collect stamps and earn rewards with Google Wallet.'
                }
            </div>
        </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ Google Wallet generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate Google Wallet pass',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also handle HEAD requests for the same logic
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId

    // Get customer card data to verify it exists
    const supabase = await createClient()

    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select('id')
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('❌ Google Wallet HEAD request error:', error)
    return new NextResponse(null, { status: 500 })
  }
} 