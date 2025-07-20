import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import jwt from 'jsonwebtoken'
import * as QRCode from 'qrcode'
import winston from 'winston'

// Winston logger for wallet errors
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'wallet-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'wallet-combined.log' })
  ]
})

// Google Wallet class creation function with dynamic card type support
async function createGoogleWalletClass(cardType: 'loyalty' | 'membership' = 'loyalty') {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google Wallet credentials not configured')
  }

  const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
  const classId = `${issuerID}.${cardType}.rewardjar`
  
  console.log('🔐 Creating Google Wallet class with RS256 algorithm')
  console.log('🔍 Private key format validated for class creation:', {
    hasBeginMarker: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'),
    hasEndMarker: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'),
    hasNewlines: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.includes('\\n'),
    length: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length
  })
  
  // Create class definition based on card type
  const classDefinition = {
    id: classId,
    issuerName: "RewardJar",
    programName: cardType === 'membership' ? "Digital Membership Cards" : "Digital Loyalty Cards",
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
    hexBackgroundColor: cardType === 'membership' ? "#6366f1" : "#10b981", // Indigo for membership, green for loyalty
    countryCode: "US",
    reviewStatus: "UNDER_REVIEW",
    allowMultipleUsersPerObject: false
  }

  try {
    // Create JWT for service account authentication
    const now = Math.floor(Date.now() / 1000)
    const serviceAccountToken = jwt.sign(
      {
        iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
      },
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' }
    )

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${serviceAccountToken}`
    })

    const { access_token } = await tokenResponse.json()

    // Try to create the class
    const classResponse = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(classDefinition)
    })

    if (!classResponse.ok) {
      const errorData = await classResponse.text()
      console.warn('Class creation/update warning:', errorData)
      // Don't throw error - class might already exist
    }

    console.log('✅ Google Wallet class ensured:', classId)
    return true
  } catch (error) {
    console.warn('Google Wallet class creation warning:', error)
    // Don't throw error - might work anyway
    return false
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  const resolvedParams = await params
  const customerCardId = resolvedParams.customerCardId
  
  try {
    const supabase = await createClient()

    console.log('Generating Google Wallet for card ID:', customerCardId)

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
      const errorMsg = `Customer card not found: ${customerCardId}`
      console.error(errorMsg, error)
      logger.error('Google Wallet customer card lookup failed', {
        customerCardId,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    console.log('Fetched customer card:', customerCard)

    // Handle the data structure properly - stamp_cards is an object, not an array
    const stampCardData = (customerCard.stamp_cards as unknown) as {
      id: string
      total_stamps: number
      name: string
      reward_description: string
      businesses: {
        name: string
        description: string
      }
    }

    const businessData = stampCardData?.businesses as {
      name: string
      description: string
    }

    if (!stampCardData || !businessData) {
      const errorMsg = 'Stamp card or business data missing'
      console.error(errorMsg)
      return NextResponse.json(
        { error: 'Card data incomplete' },
        { status: 404 }
      )
    }

    // Determine card type and calculate appropriate progress
    const isMembership = customerCard.membership_type === 'gym' || customerCard.membership_type === 'membership'
    let progress: number
    let isCompleted: boolean
    let primaryText: string
    let secondaryText: string
    let pointsUsed: number
    let pointsTotal: number

    if (isMembership) {
      // Handle membership logic
      const sessionsUsed = customerCard.sessions_used || 0
      const totalSessions = customerCard.total_sessions || 20
      progress = (sessionsUsed / totalSessions) * 100
      isCompleted = sessionsUsed >= totalSessions
      pointsUsed = sessionsUsed
      pointsTotal = totalSessions
      primaryText = `${sessionsUsed} / ${totalSessions} Sessions Used`
      secondaryText = isCompleted ? 
        'All sessions complete!' : 
        `${totalSessions - sessionsUsed} sessions remaining`
      
      // Check if membership is expired
      const isExpired = customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false
      if (isExpired && !isCompleted) {
        isCompleted = true
        secondaryText = 'Membership expired'
      }
    } else {
      // Handle loyalty card logic
      progress = (customerCard.current_stamps / stampCardData.total_stamps) * 100
      isCompleted = customerCard.current_stamps >= stampCardData.total_stamps
      pointsUsed = customerCard.current_stamps
      pointsTotal = stampCardData.total_stamps
      primaryText = `${customerCard.current_stamps} / ${stampCardData.total_stamps} Stamps`
      secondaryText = isCompleted ? 
        'Reward ready to claim!' : 
        `${stampCardData.total_stamps - customerCard.current_stamps} stamps needed`
    }

    const stampCard = {
      id: stampCardData.id,
      name: stampCardData.name || 'Loyalty Card',
      total_stamps: stampCardData.total_stamps || 10,
      reward_description: stampCardData.reward_description || 'Reward'
    }

    const business = {
      name: businessData.name || 'Business',
      description: businessData.description || 'Visit us to collect stamps and earn rewards!'
    }

    console.log('Stamp Card:', stampCard)
    console.log('Business:', business)
    
    // Generate QR code for join URL
    const PRODUCTION_DOMAIN = 'https://www.rewardjar.xyz'
    let baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || PRODUCTION_DOMAIN
    
    // Fix localhost/IP address issues for production-ready QR codes
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || 
        baseUrl.includes('0.0.0.0') || baseUrl.includes('192.168.')) {
      console.warn('⚠️ Using production domain for QR code instead of localhost/IP')
      baseUrl = PRODUCTION_DOMAIN
    }
    
    const joinUrl = `${baseUrl}/join/${stampCard.id}`
    
    let qrCodeDataUrl = ''
    const qrGenerationStartTime = Date.now()
    try {
      qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      })
      
      const qrGenerationTime = Date.now() - qrGenerationStartTime
      
      logger.info('QR code generated successfully', {
        customerCardId,
        stampCardId: stampCard.id,
        joinUrl,
        qrCodeSize: qrCodeDataUrl.length,
        qrGenerationTimeMs: qrGenerationTime,
        dimensions: '256x256px',
        errorCorrectionLevel: 'L',
        margin: '4-module',
        timestamp: new Date().toISOString()
      })
      
      console.log('✅ QR code generated successfully for URL:', joinUrl)
    } catch (qrError) {
      const errorMsg = `Failed to generate QR code: ${qrError}`
      console.error(errorMsg)
      logger.error('QR code generation failed', {
        customerCardId,
        stampCardId: stampCard.id,
        joinUrl,
        error: qrError instanceof Error ? qrError.message : String(qrError),
        timestamp: new Date().toISOString()
      })
      
      // Continue without QR code - will show placeholder
      qrCodeDataUrl = ''
    }

    // Check if Google Wallet is configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_CLASS_ID) {
      return NextResponse.json(
        { 
          error: 'Google Wallet not configured', 
          message: 'Please contact support for Google Wallet integration'
        },
        { status: 503 }
      )
    }

    // Ensure Google Wallet class exists with correct card type
    try {
      await createGoogleWalletClass(isMembership ? 'membership' : 'loyalty')
    } catch (error) {
      console.warn('Could not create Google Wallet class:', error)
      // Continue anyway - class might already exist
    }

    // Generate Google Wallet pass data with dynamic card type support
    const googlePassData = {
      "@context": "https://schema.org",
      "@type": "LoyaltyProgram",
      "name": stampCard.name,
      "description": stampCard.reward_description,
      "provider": {
        "@type": "Organization",
        "name": business.name,
        "description": business.description
      },
      "loyaltyObject": {
        "id": `${process.env.GOOGLE_ISSUER_ID || '3388000000022940702'}.${isMembership ? 'membership' : 'loyalty'}.rewardjar.${customerCardId}`,
        "classId": `${process.env.GOOGLE_ISSUER_ID || '3388000000022940702'}.${isMembership ? 'membership' : 'loyalty'}.rewardjar`,
        "state": "ACTIVE",
        "accountId": customerCardId,
        "accountName": `Customer ${customerCardId.substring(0, 8)}`,
        "loyaltyPoints": {
          "balance": {
            "string": isMembership ? `${pointsUsed}/${pointsTotal}` : `${customerCard.current_stamps}/${stampCardData.total_stamps}`
          },
          "label": isMembership ? "Sessions Used" : "Stamps Collected"
        },
        "secondaryLoyaltyPoints": {
          "balance": {
            "string": `${Math.round(progress)}%`
          },
          "label": "Progress"
        },
        "barcode": {
          "type": "QR_CODE",
          "value": customerCardId,
          "alternateText": `Card ID: ${customerCardId}`
        },
        "textModulesData": [
          {
            "id": "business_info",
            "header": business.name,
            "body": business.description || (isMembership ? "Visit us for your fitness sessions!" : "Visit us to collect stamps and earn rewards!")
          },
          {
            "id": "reward_info",
            "header": isMembership ? "Membership Value" : "Your Reward",
            "body": isMembership ? 
              `₩${(customerCard.cost || 15000).toLocaleString()} membership with ${customerCard.total_sessions || 20} sessions` :
              stampCard.reward_description
          },
          {
            "id": "status",
            "header": "Status",
            "body": isCompleted ? 
              (isMembership ? "All sessions used!" : "Congratulations! Your reward is ready to claim.") :
              (isMembership ? 
                `${pointsTotal - pointsUsed} sessions remaining` :
                `Collect ${pointsTotal - pointsUsed} more stamps to unlock your reward.`)
          }
        ],
        "hexBackgroundColor": isMembership ? "#6366f1" : "#10b981", // Indigo for membership, green for loyalty
        "validTimeInterval": {
          "start": {
            "date": new Date().toISOString()
          }
        }
      }
    }

    // Check if we have the private key for JWT signing
    const hasPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

    // For debugging, return JSON structure
    if (request.nextUrl.searchParams.get('debug') === 'true') {
      return NextResponse.json({
        loyaltyObject: googlePassData.loyaltyObject,
        serviceAccountConfigured: !!hasPrivateKey,
        cardType: isMembership ? 'membership' : 'loyalty',
        environment: {
          serviceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          classId: !!process.env.GOOGLE_CLASS_ID,
          privateKey: !!hasPrivateKey
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // If fully configured, generate JWT and "Add to Google Wallet" functionality
    if (hasPrivateKey) {
      try {
        const jwtToken = generateGoogleWalletJWT(googlePassData.loyaltyObject)
        const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`
        
        // Return interactive Google Wallet page
        const googleWalletHTML = generateGoogleWalletHTML(
          customerCard, 
          stampCard, 
          business, 
          saveUrl, 
          isCompleted, 
          progress, 
          pointsTotal - pointsUsed,
          qrCodeDataUrl,
          joinUrl,
          isMembership // Pass card type to HTML generator
        )
        
        return new NextResponse(googleWalletHTML, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
      } catch (error) {
        console.error('Error generating Google Wallet JWT:', error)
        logger.error('Google Wallet JWT generation failed', {
          customerCardId,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { 
            error: 'Failed to generate Google Wallet pass',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    }

    // Return setup instructions if not fully configured
    const instructionsHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Google Wallet - Setup Required</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 mb-2">Google Wallet Integration</h1>
            <p class="text-gray-600">Google Wallet passes require additional setup</p>
        </div>
        
        <div class="space-y-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold text-blue-900 mb-2">Required Setup:</h3>
                <ul class="text-sm text-blue-800 space-y-1">
                    <li>• Google Cloud Project</li>
                    <li>• Google Wallet API enabled</li>
                    <li>• Service account credentials</li>
                    <li>• Issuer account approval</li>
                </ul>
            </div>
        </div>
        
        <div class="text-center">
            <a href="https://developers.google.com/wallet/generic/web/prerequisites" 
               target="_blank" 
               class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Setup Guide
            </a>
        </div>
    </div>
</body>
</html>`

    return new NextResponse(instructionsHTML, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    const errorMsg = `Google Wallet generation error: ${error}`
    console.error(errorMsg)
    logger.error('Google Wallet generation failed', {
      customerCardId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate Google Wallet pass',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// JWT generation function for Google Wallet with enhanced error handling
function generateGoogleWalletJWT(loyaltyObject: any) {
  console.log('🔐 Signing JWT with RS256 algorithm for Google Wallet')
  
  // Validate private key exists
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable is not set')
  }
  
  // Validate service account email
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is not set')
  }
  
  // Process the private key to handle various formats
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  
  console.log('🔍 Original private key format check:', {
    length: privateKey.length,
    hasEscapedNewlines: privateKey.includes('\\n'),
    hasActualNewlines: privateKey.includes('\n'),
    startsWithBeginMarker: privateKey.startsWith('-----BEGIN'),
    endsWithEndMarker: privateKey.endsWith('-----')
  })
  
  // Clean up any surrounding quotes or whitespace
  privateKey = privateKey.trim().replace(/^["']|["']$/g, '')
  
  // Replace escaped newlines with actual newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
    console.log('✅ Converted escaped newlines to actual newlines')
  }
  
  // Remove any extra quotes that might be embedded within the key
  privateKey = privateKey.replace(/^""|""$/g, '')
  
  // Ensure proper PEM format structure
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    // Try to add PEM headers if missing
    if (!privateKey.startsWith('-----BEGIN')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`
    }
    if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
      privateKey = `${privateKey}\n-----END PRIVATE KEY-----`
    }
    console.log('✅ Added missing PEM format headers')
  }
  
  // Validate private key format structure
  console.log('🔍 Final private key format validation:', {
    hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
    hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
    hasNewlines: privateKey.includes('\n'),
    totalLength: privateKey.length,
    lineCount: privateKey.split('\n').length
  })

  // Additional validation - check if key has proper structure
  const keyLines = privateKey.split('\n')
  const hasProperStructure = keyLines.length >= 3 && 
                             keyLines.some(line => line.trim() === '-----BEGIN PRIVATE KEY-----') && 
                             keyLines.some(line => line.trim() === '-----END PRIVATE KEY-----')
  
  if (!hasProperStructure) {
    console.error('❌ Invalid private key structure detected')
    console.error('Key lines:', keyLines.map((line, i) => `${i}: "${line.trim()}"`))
    throw new Error('Invalid private key format - secretOrPrivateKey must be an asymmetric key when using RS256. Please ensure GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is a valid PEM-formatted RSA private key with proper newlines.')
  }

  // Validate the key contains base64 content between headers
  const keyContent = keyLines.filter(line => 
    !line.includes('-----BEGIN') && 
    !line.includes('-----END') && 
    line.trim().length > 0
  )
  
  if (keyContent.length === 0) {
    console.error('❌ No base64 content found in private key')
    throw new Error('Invalid private key format - no base64 content found between PEM headers')
  }

  const claims = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    origins: ['www.rewardjar.xyz', 'rewardjar.xyz'],
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [loyaltyObject]
    }
  }

  console.log('🔐 JWT claims:', {
    issuer: claims.iss,
    audience: claims.aud,
    origins: claims.origins,
    type: claims.typ,
    hasLoyaltyObjects: !!claims.payload.loyaltyObjects.length
  })

  try {
    console.log('🔐 Attempting JWT signing with validated private key...')
    const token = jwt.sign(claims, privateKey, {
      algorithm: 'RS256'
    })
    
    console.log('✅ JWT generated successfully')
    console.log('🔍 Token preview:', token.substring(0, 50) + '...')
    return token
  } catch (error) {
    console.error('❌ JWT signing failed with error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('secretOrPrivateKey')) {
        throw new Error('Invalid private key format - secretOrPrivateKey must be an asymmetric key when using RS256. Please check that GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY contains a valid PEM-formatted RSA private key.')
      } else if (error.message.includes('PEM')) {
        throw new Error('Invalid PEM format - please ensure the private key is properly formatted with correct newlines and headers.')
      } else {
        throw new Error(`JWT signing failed: ${error.message}`)
      }
    }
    
    throw new Error('JWT signing failed with unknown error')
  }
}

// Enhanced HTML generation function with card type support
function generateGoogleWalletHTML(
  customerCard: any, 
  stampCard: any, 
  business: any, 
  saveUrl: string, 
  isCompleted: boolean, 
  progress: number, 
  remaining: number,
  qrCodeDataUrl: string, 
  joinUrl: string,
  isMembership: boolean = false
) {
  const cardTypeLabel = isMembership ? 'Membership Card' : 'Loyalty Card'
  const progressLabel = isMembership ? 'Sessions' : 'Stamps'
  const cardColor = isMembership ? '#6366f1' : '#10b981'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Wallet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .card-gradient {
            background: linear-gradient(135deg, ${cardColor}22, ${cardColor}11);
        }
        .btn-primary {
            background-color: ${cardColor};
        }
        .btn-primary:hover {
            background-color: ${cardColor}dd;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <div class="text-center mb-6">
            <div class="flex justify-center items-center mb-4">
                <svg class="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                </svg>
                <h1 class="text-xl font-semibold text-gray-800">Google Wallet</h1>
            </div>
            <p class="text-sm text-gray-600">Digital ${cardTypeLabel}</p>
        </div>

        <div class="card-gradient rounded-2xl p-6 mb-6 shadow-lg" style="background: linear-gradient(135deg, ${cardColor}, ${cardColor}dd);">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h2 class="text-white text-lg font-bold">${stampCard.name}</h2>
                    <p class="text-white text-sm opacity-90">${business.name}</p>
                </div>
                <div class="text-right">
                    <div class="text-white text-2xl font-bold">${isMembership ? customerCard.sessions_used || 0 : customerCard.current_stamps || 0}</div>
                    <div class="text-white text-xs opacity-75">of ${isMembership ? customerCard.total_sessions || 20 : stampCard.total_stamps}</div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-white text-xs mb-1">
                    <span>${progressLabel} Progress</span>
                    <span>${Math.round(progress)}% Complete</span>
                </div>
                <div class="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div class="bg-white h-2 rounded-full transition-all duration-300" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
            </div>
            
            <div class="text-white text-sm">
                ${isCompleted ? 
                  (isMembership ? '🎉 All sessions used!' : '🎉 Reward ready!') : 
                  (isMembership ? `${remaining} sessions remaining` : `${remaining} stamps needed`)
                }
            </div>
        </div>

        <div class="space-y-4 mb-6">
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <h3 class="font-semibold text-gray-800 mb-2">${isMembership ? 'Membership Value' : 'Your Reward'}</h3>
                <p class="text-gray-600 text-sm">
                    ${isMembership ? 
                      `₩${(customerCard.cost || 15000).toLocaleString()} membership with ${customerCard.total_sessions || 20} sessions` :
                      stampCard.reward_description
                    }
                </p>
            </div>
            
            ${business.description ? `
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <h3 class="font-semibold text-gray-800 mb-2">${business.name}</h3>
                <p class="text-gray-600 text-sm">${business.description}</p>
            </div>
            ` : ''}
            
            ${qrCodeDataUrl ? `
            <div class="bg-white rounded-lg p-4 shadow-sm text-center">
                <h3 class="font-semibold text-gray-800 mb-3">Scan this QR code at ${business.name} to ${isMembership ? 'mark sessions' : 'collect stamps'}</h3>
                <img src="${qrCodeDataUrl}" alt="QR Code" class="mx-auto mb-2" style="width: 200px; height: 200px;">
                <p class="text-xs text-gray-500 mt-2">Links to: ${joinUrl}</p>
                <p class="text-xs text-gray-400 mt-1">Card ID: ${customerCard.id.substring(0, 8)}</p>
            </div>
            ` : ''}
        </div>

        <div class="text-center">
            <a href="${saveUrl}" 
               class="btn-primary text-white px-8 py-3 rounded-lg font-medium inline-flex items-center justify-center hover:shadow-lg transition-all duration-200 w-full">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                </svg>
                Add to Google Wallet
            </a>
        </div>

        <div class="text-center mt-4">
            <p class="text-xs text-gray-500">
                After adding your ${cardTypeLabel.toLowerCase()} to Wallet, you'll see your point 
                balance and ${cardTypeLabel.toLowerCase()} benefits in places like Maps, Shopping, and 
                more. You can turn this off in 
                <a href="#" class="text-blue-600">Google Wallet passes data</a> or on 
                an individual pass in the Google Wallet app.
            </p>
        </div>

        <div class="mt-6 space-y-2">
            <p class="text-xs text-gray-400">
                Pass providers can automatically add related passes, 
                promotions, offers and more to your existing passes which can 
                be controlled on your device in Wallet settings.
            </p>
            <div class="flex justify-center space-x-4 text-xs">
                <a href="#" class="text-blue-600">Terms</a>
                <span class="text-gray-400">and</span>
                <a href="#" class="text-blue-600">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`
} 