import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Google Wallet credentials not configured' },
        { status: 400 }
      )
    }

    // Get card type from request body (default to loyalty for backward compatibility)
    const body = await request.json().catch(() => ({}))
    const cardType = body.cardType || 'loyalty'
    const version = body.version || 'v2' // Default to v2 for new classes with correct titles

    const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
    const classId = cardType === 'membership' 
      ? `${issuerID}.membership.rewardjar_${version}`
      : `${issuerID}.loyalty.rewardjar_${version}`
    
    const programName = cardType === 'membership' ? 'Membership Cards' : 'Stamp Cards'
    
    // Create dynamic class definition
    const loyaltyClass = {
      id: classId,
      issuerName: "RewardJar",
      programName: programName,
      programLogo: {
        sourceUri: {
          uri: "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "RewardJar Logo"
          }
        }
      },
      hexBackgroundColor: "#10b981",
      countryCode: "US",
      reviewStatus: "UNDER_REVIEW",
      allowMultipleUsersPerObject: false
    }

    // Generate service account token for Google Wallet API
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
      return NextResponse.json(
        { error: 'Invalid private key format - must be PEM format' },
        { status: 400 }
      )
    }
    
    const serviceAccountToken = jwt.sign(
      {
        iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
        aud: 'https://oauth2.googleapis.com/token',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      },
      privateKey,
      { algorithm: 'RS256' }
    )

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${serviceAccountToken}`
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      return NextResponse.json(
        { error: 'Failed to get access token', details: errorData },
        { status: 500 }
      )
    }

    const { access_token } = await tokenResponse.json()

    // Try to create the class
    const classResponse = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loyaltyClass)
    })

    const responseData = await classResponse.text()

    return NextResponse.json({
      success: classResponse.ok,
      status: classResponse.status,
      classId,
      response: responseData
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create Google Wallet class', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 