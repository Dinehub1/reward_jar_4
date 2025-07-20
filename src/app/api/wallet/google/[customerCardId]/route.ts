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

// Google Wallet class creation function
async function createGoogleWalletClass() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google Wallet credentials not configured')
  }

  const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
  const classId = `${issuerID}.loyalty.rewardjar`
  
  // Create loyalty class definition
  const loyaltyClass = {
    id: classId,
    issuerName: "RewardJar",
    programName: "Digital Loyalty Cards",
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

  try {
    // Process the private key to handle various formats properly (same logic as generateGoogleWalletJWT)
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
    
    // Additional validation for JWT library compatibility
    if (!privateKey.trim().startsWith('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key must start with PEM header')
    }

    console.log('🔐 Creating Google Wallet class with RS256 algorithm')
    console.log('🔍 Private key format validated for class creation:', {
      hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
      hasNewlines: privateKey.includes('\n'),
      length: privateKey.length
    })

    // Generate service account token for Google Wallet API
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
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId

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
    const isGymMembership = customerCard.membership_type === 'gym'
    let progress: number
    let isCompleted: boolean
    let primaryText: string
    let secondaryText: string
    let pointsUsed: number
    let pointsTotal: number

    if (isGymMembership) {
      // Handle gym membership logic
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
    
    // Progress and completion already calculated above based on card type

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
        errorCorrectionLevel: 'L', // Level L (7%) - most reliable for scanning per Google Wallet guidelines
        type: 'image/png',
        margin: 4, // 4-module padding as per Google Wallet best practices
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256 // 256x256px optimal size for wallet display and mobile scanning
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

    // Ensure Google Wallet class exists
    try {
      await createGoogleWalletClass()
    } catch (error) {
      console.warn('Could not create Google Wallet class:', error)
      // Continue anyway - class might already exist
    }

    // Generate Google Wallet pass data
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
        "id": `${process.env.GOOGLE_ISSUER_ID || '3388000000022940702'}.loyalty.rewardjar.${customerCardId}`,
        "classId": `${process.env.GOOGLE_ISSUER_ID || '3388000000022940702'}.loyalty.rewardjar`,
        "state": "ACTIVE",
        "accountId": customerCardId,
        "accountName": `Customer ${customerCardId.substring(0, 8)}`,
        "loyaltyPoints": {
          "balance": {
            "string": `${customerCard.current_stamps}/${stampCard.total_stamps}`
          },
          "label": "Stamps Collected"
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
            "body": business.description || "Visit us to collect stamps and earn rewards!"
          },
          {
            "id": "reward_info",
            "header": "Your Reward",
            "body": stampCard.reward_description
          },
          {
            "id": "status",
            "header": "Status",
            "body": isCompleted ? 
              "Congratulations! Your reward is ready to claim." : 
              `Collect ${pointsTotal - pointsUsed} more stamps to unlock your reward.`
          }
        ],
        "hexBackgroundColor": "#10b981", // green-500
        "validTimeInterval": {
          "start": {
            "date": new Date().toISOString()  // Full ISO 8601 format required by Google Wallet
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
          qrCodeDataUrl, // Pass the QR code data URL
          joinUrl // Pass the join URL for additional context
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
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 mb-2">Card Information:</h3>
                <div class="text-sm text-gray-700 space-y-1">
                    <p><strong>Card:</strong> ${stampCard.name}</p>
                    <p><strong>Business:</strong> ${business.name}</p>
                    <p><strong>Progress:</strong> ${customerCard.current_stamps}/${stampCard.total_stamps} stamps (${Math.round(progress)}%)</p>
                    <p><strong>Reward:</strong> ${stampCard.reward_description}</p>
                </div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 class="font-semibold text-green-900 mb-2">Alternative Options:</h3>
                <div class="space-y-2">
                    <a href="/api/wallet/pwa/${customerCardId}" class="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded font-medium">
                        Use Web App Instead
                    </a>
                    <a href="/api/wallet/apple/${customerCardId}" class="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded font-medium">
                        Try Apple Wallet
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
    
    <script>
        // If Google Wallet is configured, this would generate the "Add to Google Wallet" button
        console.log('Google Wallet pass data:', ${JSON.stringify(googlePassData, null, 2)});
    </script>
</body>
</html>
    `

    return new NextResponse(instructionsHTML, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Error generating Google Wallet pass:', error)
    logger.error('Google Wallet pass generation failed', {
      customerCardId: (await params).customerCardId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Failed to generate Google Wallet pass' },
      { status: 500 }
    )
  }
}

// Google Wallet JWT generation with proper private key handling
function generateGoogleWalletJWT(loyaltyObject: Record<string, unknown>): string {
  const jwtPayload = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [loyaltyObject]
    }
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google service account private key not configured')
  }

  // Process the private key to handle various formats properly
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
  
  // Additional validation for JWT library compatibility
  if (!privateKey.trim().startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Private key must start with PEM header')
  }

  console.log('🔐 Signing JWT with RS256 algorithm for Google Wallet')
  console.log('🔍 Private key format validated:', {
    hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
    hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
    hasNewlines: privateKey.includes('\n'),
    length: privateKey.length
  })

  return jwt.sign(jwtPayload, privateKey, {
    algorithm: 'RS256'
  })
}

// Generate interactive Google Wallet HTML
function generateGoogleWalletHTML(
  customerCard: Record<string, unknown>, 
  stampCard: Record<string, unknown>, 
  business: Record<string, unknown>, 
  saveUrl: string, 
  isCompleted: boolean, 
  progress: number, 
  stampsRemaining: number,
  qrCodeDataUrl: string,
  joinUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${stampCard.name} - Google Wallet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#4285f4">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .progress-bar {
            background: linear-gradient(90deg, #10b981 0%, #10b981 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
        .google-wallet-button {
            background: #4285f4;
            transition: all 0.3s ease;
        }
        .google-wallet-button:hover {
            background: #3367d6;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Google Wallet</h1>
            <p class="text-gray-600">Digital Loyalty Card</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden mb-6">
            <!-- Card Header -->
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-xl font-bold">${stampCard.name}</h2>
                        <p class="text-blue-100">${business.name}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold">${customerCard.current_stamps}</div>
                        <div class="text-sm text-blue-100">of ${stampCard.total_stamps}</div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-blue-400 rounded-full h-3 mb-2">
                    <div class="progress-bar h-3 rounded-full transition-all duration-500"></div>
                </div>
                <div class="text-center text-blue-100 text-sm">${Math.round(progress)}% Complete</div>
            </div>

            <!-- Card Content -->
            <div class="p-6">
                <!-- Reward Section -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Your Reward</h3>
                    <p class="text-gray-700 mb-4">${stampCard.reward_description}</p>
                    
                    ${isCompleted ? 
                      '<div class="bg-green-50 border border-green-200 rounded-lg p-3"><div class="flex items-center text-green-800"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg><span class="font-semibold">Ready to claim!</span></div><p class="text-green-700 text-sm mt-1">Show this card to redeem your reward.</p></div>' :
                      '<div class="bg-gray-50 border border-gray-200 rounded-lg p-3"><p class="text-gray-600 text-sm">Collect ${stampsRemaining} more stamps to unlock this reward.</p></div>'
                    }
                </div>

                                <!-- QR Code Section -->
                <div class="text-center border-t pt-4">
                    <div class="bg-gray-50 rounded-lg p-4 mb-3">
                        <div class="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center mb-2">
                            ${qrCodeDataUrl ? 
                              `<img src="${qrCodeDataUrl}" alt="QR Code linking to ${joinUrl}" class="w-full h-full object-contain rounded-lg">` :
                              `<svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clip-rule="evenodd"></path>
                               </svg>
                               <div class="text-xs text-red-500 mt-1">QR Code failed to load</div>`
                             }
                        </div>
                        <p class="text-sm text-gray-600">Scan this QR code at ${business.name} to collect stamps</p>
                        ${qrCodeDataUrl ? 
                          `<p class="text-xs text-gray-500 mt-2">Links to: ${joinUrl}</p>` :
                          `<p class="text-xs text-gray-500 mt-2">QR code temporarily unavailable</p>`
                        }
                    </div>
                    <p class="text-xs text-gray-500">Card ID: ${(customerCard.id as string).substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- Google Wallet Button -->
        <div class="mb-6">
            <a href="${saveUrl}" 
               target="_blank" 
               class="google-wallet-button w-full text-white font-semibold py-4 px-6 rounded-lg block text-center">
                <div class="flex items-center justify-center">
                    <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                    </svg>
                    Add to Google Wallet
                </div>
            </a>
        </div>

        <!-- Alternative Actions -->
        <div class="space-y-3">
            <button onclick="refreshCard()" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Refresh Card
            </button>
            <div class="flex space-x-3">
                <a href="/api/wallet/apple/${customerCard.id}" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Try Apple Wallet
                </a>
                <a href="/api/wallet/pwa/${customerCard.id}" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Use Web App
                </a>
            </div>
        </div>
    </div>

    <script>
        function refreshCard() {
            window.location.reload();
        }

        // Auto-refresh every 30 seconds to sync stamps
        setInterval(refreshCard, 30000);
        
        // Track Google Wallet button clicks
        document.querySelector('.google-wallet-button').addEventListener('click', function() {
            console.log('Google Wallet button clicked');
            // You can add analytics tracking here
        });
    </script>
</body>
</html>
  `
} 