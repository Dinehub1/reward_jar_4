/**
 * RewardJar 4.0 - Google Wallet API Route (Simplified)
 * Generates Google Wallet passes for stamp cards and membership cards
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

    // Get customer card data
    const supabase = createAdminClient()

    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select('*')
      .eq('id', customerCardId)
      .single()
    
    if (error || !customerCard) {
      console.error('❌ Customer card not found:', error)
      return NextResponse.json({ error: 'Customer card not found' }, { status: 404 })
    }

    // Fetch related card data
    let cardData: any = null
    let businessData: any = null
    const isMembershipCard = !!customerCard.membership_card_id

    if (customerCard.stamp_card_id) {
      const { data } = await supabase
        .from('stamp_cards')
        .select('*')
        .eq('id', customerCard.stamp_card_id)
        .single()
      cardData = data
    } else if (customerCard.membership_card_id) {
      const { data } = await supabase
        .from('membership_cards')
        .select('*')
        .eq('id', customerCard.membership_card_id)
        .single()
      cardData = data
    }

    if (cardData?.business_id) {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', cardData.business_id)
        .single()
      businessData = data
    }

    // Use existing approved class
    const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
    const classId = `${issuerID}.loyalty.rewardjar_v3` // Use the approved class
    const objectId = `${classId}.${customerCardId.replace(/-/g, '')}`

    console.log('🆔 Generated IDs:', { classId, objectId })

    // We're using the existing approved class, so no need to define it again

    // Create minimal loyalty object
    const loyaltyObject = {
      id: objectId,
      classId: classId,
      state: 'ACTIVE',
      loyaltyPoints: {
        label: 'Points',
        balance: {
          string: `${customerCard.current_stamps || 0}/${cardData?.total_stamps || cardData?.stamps_required || 10}`
        }
      },
      accountName: 'Guest User',
      accountId: customerCard.id.substring(0, 20),
      barcode: {
        type: 'QR_CODE',
        value: customerCard.id,
        alternateText: customerCard.id.substring(0, 20)
      }
    }

    // Create JWT payload - only include the object, not the class since it already exists
    const payload = {
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
      payload: {
        loyaltyObjects: [loyaltyObject]
      }
    }

    console.log('🔍 JWT payload created')

    // Check environment variables
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

    if (!serviceAccountEmail || !privateKey) {
      console.error('❌ Missing Google Wallet credentials')
      return NextResponse.json({ error: 'Google Wallet not configured' }, { status: 500 })
    }

    // Process private key
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '')

    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Invalid private key format')
      return NextResponse.json({ error: 'Invalid private key format' }, { status: 500 })
    }

    // Sign JWT
    const crypto = require('crypto')
    
    let jwt: string
    try {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
      const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signatureInput = `${header}.${payloadStr}`
      
      const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), privateKey).toString('base64url')
      jwt = `${signatureInput}.${signature}`
      
      console.log('✅ JWT signed successfully')
    } catch (signError) {
      console.error('❌ JWT signing failed:', signError)
      return NextResponse.json({ 
        error: 'Failed to sign JWT token',
        details: signError instanceof Error ? signError.message : 'Unknown signing error'
      }, { status: 500 })
    }

    // Generate save URL
    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`

    // Return HTML page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add to Google Wallet - ${cardData?.name || 'Loyalty Card'}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, ${cardData?.card_color || '#8B4513'} 0%, #059669 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
            }
            .card-preview {
                background: ${cardData?.card_color || '#8B4513'};
                color: white;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .business-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .card-title {
                font-size: 16px;
                opacity: 0.9;
            }
            .add-button {
                background: #4285f4;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin-top: 20px;
                transition: background 0.2s;
            }
            .add-button:hover {
                background: #3367d6;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎫 Add to Google Wallet</h1>
            
            <div class="card-preview">
                <div class="business-name">${businessData?.name || 'Business'}</div>
                <div class="card-title">${cardData?.name || 'Loyalty Card'}</div>
                <div style="margin-top: 15px; font-size: 14px;">
                    ${cardData?.icon_emoji || '⭐'} ${customerCard.current_stamps || 0}/${cardData?.total_stamps || cardData?.stamps_required || 10} stamps
                </div>
            </div>
            
            <p>Add this loyalty card to your Google Wallet for easy access.</p>
            
            <a href="${saveUrl}" class="add-button">
                📱 Add to Google Wallet
            </a>
        </div>
    </body>
    </html>`

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  // Redirect POST to GET for Google Wallet
  return GET(request, { params })
}