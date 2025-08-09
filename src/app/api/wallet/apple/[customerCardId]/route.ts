import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import envelope from '@/lib/api/envelope'
import { buildUnifiedCardData, signForPlatform } from '@/lib/wallet/wallet-generation-service'
import { getAppleWalletBaseUrl } from '@/lib/env'
import crypto from 'crypto'
import archiver from 'archiver'
import forge from 'node-forge'
import sharp from 'sharp'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

// Helper function to get valid webServiceURL for Apple Wallet
function getValidWebServiceURL(): string {
  const baseUrl = getAppleWalletBaseUrl()
  return `${baseUrl}/api/wallet/apple/updates`
}

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
    const customerCardId = resolvedParams.customerCardId
    const admin = createAdminClient()

    console.log('🍎 Generating Apple Wallet for card ID:', customerCardId)

    // Get customer card with minimal fields then delegate to service
    const { data: customerCard, error } = await admin
      .from('customer_cards')
      .select('id, customer_id, stamp_card_id, membership_card_id')
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('❌ Customer card not found:', error)
      return NextResponse.json(envelope(undefined, 'Customer card not found'), { status: 404 })
    }

    console.log('✅ Fetched customer card:', customerCard)

    const cardId = customerCard.stamp_card_id || customerCard.membership_card_id
    if (!cardId) return NextResponse.json(envelope(undefined, 'No linked card'), { status: 400 })
    const unified = await buildUnifiedCardData(cardId, customerCard.customer_id)
    const signed = await signForPlatform('apple', unified)
    if (!signed.success) return NextResponse.json(envelope(undefined, signed.error || 'Failed to sign'), { status: 500 })
    return NextResponse.json(envelope({ pkpassUrl: signed.pkpassUrl }))
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

    // Generate Apple Wallet pass JSON
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      serialNumber: customerCardId,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
      organizationName: "RewardJar",
      description: `${cardData.name} - ${businessData.name}`,
      logoText: "RewardJar",
      backgroundColor: cardData.card_color ? hexToRgb(cardData.card_color) : (isMembershipCard ? "rgb(99, 102, 241)" : "rgb(16, 185, 129)"), // Use card-specific color
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(255, 255, 255)",
      
      storeCard: {
        primaryFields: [
          {
            key: isMembershipCard ? "sessions" : "stamps",
            label: progressLabel,
            value: primaryValue,
            textAlignment: "PKTextAlignmentCenter"
          }
        ],
        secondaryFields: [
          {
            key: "progress",
            label: "Progress",
            value: `${Math.round(progress)}%`,
            textAlignment: "PKTextAlignmentLeft"
          },
          {
            key: "remaining",
            label: remainingLabel,
            value: isCompleted ? 
              (isMembershipCard ? "Complete" : "Completed!") : 
              `${remaining} ${isMembershipCard ? 'sessions' : 'stamps'}`,
            textAlignment: "PKTextAlignmentRight"
          }
        ],
        auxiliaryFields: [
          {
            key: "business",
            label: "Business",
            value: businessData.name,
            textAlignment: "PKTextAlignmentLeft"
          },
          ...(isMembershipCard ? [
            {
              key: "cost",
              label: "Value",
              value: `₩${(customerCard.membership_cards?.[0]?.cost || 15000).toLocaleString()}`,
              textAlignment: "PKTextAlignmentRight"
            }
          ] : [
            {
              key: "reward",
              label: "Reward",
              value: cardData.reward_description,
              textAlignment: "PKTextAlignmentRight"
            }
          ])
        ],
        headerFields: [
          {
            key: "card_name",
            label: isMembershipCard ? "Membership" : "Stamp Card",
                          value: cardData.name,
            textAlignment: "PKTextAlignmentCenter"
          }
        ],
        backFields: [
          {
            key: "description",
            label: "About",
            value: isMembershipCard ? 
              `Gym membership with ${customerCard.membership_cards?.[0]?.total_sessions || 20} sessions. Value: ₩${(customerCard.membership_cards?.[0]?.cost || 15000).toLocaleString()}.` :
              `Collect ${cardData.total_stamps} stamps to earn: ${cardData.reward_description}`
          },
          {
            key: "business_info",
            label: businessData.name,
            value: businessData.description || (isMembershipCard ? 
              "Visit us to use your gym sessions!" : 
              "Visit us to collect stamps and earn rewards!")
          },
          {
            key: "instructions",
            label: "How to Use",
            value: isMembershipCard ?
              "Show this pass at the gym to mark session usage. Your pass will automatically update when sessions are used." :
              "Show this pass to collect stamps at participating locations. Your pass will automatically update when new stamps are added."
          },
          ...(isMembershipCard && customerCard.expiry_date ? [
            {
              key: "expiry_info",
              label: "Valid Until",
              value: new Date(customerCard.expiry_date).toLocaleDateString()
            }
          ] : []),
          {
            key: "contact",
            label: "Questions?",
            value: "Contact the business directly or visit rewardjar.com for support."
          }
        ]
      },
      
      barcode: {
        message: customerCardId,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: `${isMembershipCard ? 'Membership' : 'Card'} ID: ${customerCardId}`
      },
      
      webServiceURL: `${process.env.BASE_URL || 'https://www.rewardjar.xyz'}/api/wallet/apple/updates`,
      authenticationToken: customerCardId,
      
      userInfo: {
        customerCardId: customerCardId,
        stampCardId: cardData.id,
        businessName: businessData.name,
        cardType: isMembershipCard ? 'membership' : 'stamp'
      },
      
      locations: [],
      maxDistance: 1000,
      relevantDate: new Date().toISOString(),
      
      // Add expiry for gym memberships
      ...(isMembershipCard && customerCard.expiry_date && {
        expirationDate: customerCard.expiry_date
      })
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
        webServiceURL: getValidWebServiceURL(),
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
          console.error('❌ PKPass validation failed:', validationErrors)
          return NextResponse.json(
            { 
              error: 'PKPass validation failed',
              message: validationErrors.join(', ')
            },
            { status: 400 }
          )
        }
        
        const pkpassBuffer = await generatePKPass(passData)
        
        console.log('✅ PKPass generated successfully:', {
          size: pkpassBuffer.length,
          sizeKB: (pkpassBuffer.length / 1024).toFixed(1)
        })
        
        // IMPROVED HEADERS for better iOS Safari compatibility
        return new NextResponse(pkpassBuffer, {
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
        console.error('❌ Error generating PKPass:', error)
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
    console.error('❌ Error generating Apple Wallet pass:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
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

    console.log('🍎 POST: Generating Apple Wallet for card ID:', customerCardId, 'type:', requestedType)

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
        current_stamps,
        sessions_used,
        stamp_card_id,
        membership_card_id,
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
        ),
        membership_cards (
          id,
          name,
          total_sessions,
          cost,
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

    // Determine card type from unified schema
    const isStampCard = customerCard.stamp_card_id !== null
    const isMembershipCard = customerCard.membership_card_id !== null

    if (!isStampCard && !isMembershipCard) {
      return NextResponse.json(
        { error: 'Invalid customer card: no card type found' },
        { status: 400 }
      )
    }

    console.log('📊 Apple Wallet - Customer card data:', {
      id: customerCard.id,
      isStampCard,
      isMembershipCard,
      current_stamps: customerCard.current_stamps,
      sessions_used: customerCard.sessions_used
    })

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

    console.log('🎨 Apple Wallet theme:', { cardType, backgroundColor, filename })
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Apple Wallet ${cardType} card generated successfully`,
        filename,
        cardType,
        backgroundColor
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, max-age=1'
        }
      }
    )

  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error)
    return NextResponse.json(
      { error: 'Failed to generate Apple Wallet pass' },
      { status: 500 }
    )
  }
}

// Enhanced PKPass generation with proper icons and signature
async function generatePKPass(passData: Record<string, unknown>): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting PKPass generation...')
      
      const archive = archiver('zip', { 
        zlib: { level: 9 },
        forceLocalTime: true
      })
      const chunks: Buffer[] = []
      
      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => {
        console.log('PKPass archive created successfully')
        resolve(Buffer.concat(chunks))
      })
      archive.on('error', (error) => {
        console.error('Archive error:', error)
        reject(error)
      })
      
      // Generate required icons
      const icons = await generatePassIcons({}, {})
      
      // Create pass.json
      const passJson = JSON.stringify(passData, null, 2)
      console.log('Generated pass.json:', passJson.length, 'bytes')
      
      // Create manifest with all file hashes
      const manifest: Record<string, string> = {
        'pass.json': sha1Hash(Buffer.from(passJson, 'utf8'))
      }
      
      // Add icon hashes to manifest
      for (const [filename, buffer] of Object.entries(icons)) {
        manifest[filename] = sha1Hash(buffer)
      }
      
      const manifestJson = JSON.stringify(manifest, null, 2)
      console.log('Generated manifest.json with', Object.keys(manifest).length, 'files')
      
      // Create PKCS#7 signature
      const signature = await createPKCS7Signature(Buffer.from(manifestJson, 'utf8'))
      console.log('Generated signature:', signature.length, 'bytes')
      
      // Add all files to archive
      archive.append(passJson, { name: 'pass.json' })
      archive.append(manifestJson, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })
      
      // Add icons to archive
      for (const [filename, buffer] of Object.entries(icons)) {
        archive.append(buffer, { name: filename })
      }
      
      console.log('Finalizing PKPass archive...')
      archive.finalize()
      
    } catch (error) {
      console.error('Error in generatePKPass:', error)
      reject(error)
    }
  })
}

// Generate required pass icons
async function generatePassIcons(_stampCard: Record<string, unknown>, _business: Record<string, unknown>): Promise<Record<string, Buffer>> {
  const icons: Record<string, Buffer> = {}
  
  try {
    // Create a simple branded icon using Sharp
    const baseIcon = await sharp({
      create: {
        width: 29,
        height: 29,
        channels: 4,
        background: { r: 16, g: 185, b: 129, alpha: 1 } // green-500
      }
    })
    .png()
    .toBuffer()
    
    const baseLogo = await sharp({
      create: {
        width: 160,
        height: 50,
        channels: 4,
        background: { r: 16, g: 185, b: 129, alpha: 1 } // green-500
      }
    })
    .png()
    .toBuffer()
    
    // Required icon sizes for Apple Wallet
    const iconSizes = [
      { name: 'icon.png', size: 29 },
      { name: 'icon@2x.png', size: 58 },
      { name: 'icon@3x.png', size: 87 }
    ]
    
    const logoSizes = [
      { name: 'logo.png', width: 160, height: 50 },
      { name: 'logo@2x.png', width: 320, height: 100 },
      { name: 'logo@3x.png', width: 480, height: 150 }
    ]
    
    // Generate icons
    for (const { name, size } of iconSizes) {
      icons[name] = await sharp(baseIcon)
        .resize(size, size)
        .png()
        .toBuffer()
    }
    
    // Generate logos
    for (const { name, width, height } of logoSizes) {
      icons[name] = await sharp(baseLogo)
        .resize(width, height)
        .png()
        .toBuffer()
    }
    
    console.log('Generated', Object.keys(icons).length, 'icon files')
    return icons
    
  } catch (error) {
    console.error('Error generating icons:', error)
    // Return minimal icons as fallback - MUST include all required sizes
    const fallbackIcon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    return {
      'icon.png': fallbackIcon,
      'icon@2x.png': fallbackIcon,
      'icon@3x.png': fallbackIcon, // CRITICAL for newer iPhones
      'logo.png': fallbackIcon,
      'logo@2x.png': fallbackIcon,
      'logo@3x.png': fallbackIcon
    }
  }
}

// Create proper PKCS#7 signature using openssl command (more reliable than node-forge)
async function createPKCS7Signature(manifestBuffer: Buffer): Promise<Buffer> {
  try {
    // Validate required environment variables
    if (!process.env.APPLE_CERT_BASE64 || !process.env.APPLE_KEY_BASE64 || !process.env.APPLE_WWDR_BASE64) {
      throw new Error('Missing Apple certificates in environment variables')
    }
    
    // Use imported modules
    const execAsync = promisify(exec)
    
    console.log('📜 Loading Apple Wallet certificates from environment variables')
    
    // Decode certificates from base64 - handle mixed DER/PEM formats
    const certData = Buffer.from(process.env.APPLE_CERT_BASE64, 'base64')
    const keyData = Buffer.from(process.env.APPLE_KEY_BASE64, 'base64')
    const wwdrData = Buffer.from(process.env.APPLE_WWDR_BASE64, 'base64')
    
    // Certificate is in DER format, convert to PEM
    const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(certData.toString('binary')))
    const certPem = forge.pki.certificateToPem(cert)
    
    // Private key is already in PEM format
    const keyPem = keyData.toString('utf8')
    
    // WWDR certificate is in DER format, convert to PEM  
    const wwdrCert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(wwdrData.toString('binary')))
    const wwdrPem = forge.pki.certificateToPem(wwdrCert)
    
    console.log('✅ Successfully loaded certificates from environment variables')
    
    console.log('📋 Certificate info:')
    console.log('  - Subject:', cert.subject.getField('CN').value)
    console.log('  - Valid from:', cert.validity.notBefore)
    console.log('  - Valid until:', cert.validity.notAfter)
    
    const now = new Date()
    if (cert.validity.notAfter < now) {
      throw new Error(`Pass certificate expired on ${cert.validity.notAfter.toISOString()}`)
    }
    if (wwdrCert.validity.notAfter < now) {
      throw new Error(`WWDR certificate expired on ${wwdrCert.validity.notAfter.toISOString()}`)
    }
    
    console.log('Certificate validation passed:', {
      passExpires: cert.validity.notAfter.toISOString(),
      wwdrExpires: wwdrCert.validity.notAfter.toISOString()
    })
    
    // Create temporary files for openssl
    const tmpDir = '/tmp'
    const manifestFile = path.join(tmpDir, `manifest-${Date.now()}.json`)
    const certFile = path.join(tmpDir, `cert-${Date.now()}.pem`)
    const keyFile = path.join(tmpDir, `key-${Date.now()}.pem`)
    const wwdrFile = path.join(tmpDir, `wwdr-${Date.now()}.pem`)
    const signatureFile = path.join(tmpDir, `signature-${Date.now()}.der`)
    
    try {
      // Write files
      fs.writeFileSync(manifestFile, manifestBuffer)
      fs.writeFileSync(certFile, certPem)
      fs.writeFileSync(keyFile, keyPem)
      fs.writeFileSync(wwdrFile, wwdrPem)
      
      // Use openssl to create PKCS#7 signature (Apple's recommended method)
      // Add -noattr flag to avoid issues with attributes, and ensure proper certificate chain
      const opensslCommand = `openssl smime -sign -signer "${certFile}" -inkey "${keyFile}" -certfile "${wwdrFile}" -in "${manifestFile}" -out "${signatureFile}" -outform DER -binary -noattr`
      
      console.log('Running OpenSSL command for PKCS#7 signature...')
      await execAsync(opensslCommand)
      
      // Read the signature file
      const signature = fs.readFileSync(signatureFile)
      
      console.log('Created PKCS#7 signature using OpenSSL:', signature.length, 'bytes')
      return signature
      
    } finally {
      // Clean up temporary files
      const filesToCleanup = [manifestFile, certFile, keyFile, wwdrFile, signatureFile]
      filesToCleanup.forEach(file => {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file)
          }
        } catch {
          console.warn('Could not cleanup temp file:', file)
        }
      })
    }
    
  } catch (error) {
    console.error('Error creating PKCS#7 signature:', error)
    
    // Fallback to node-forge if OpenSSL fails
    console.log('Falling back to node-forge signature generation...')
    return createNodeForgeSignature(manifestBuffer)
  }
}

// Fallback node-forge signature generation
async function createNodeForgeSignature(manifestBuffer: Buffer): Promise<Buffer> {
  try {
    // Decode certificates
    const certPem = Buffer.from(process.env.APPLE_CERT_BASE64!, 'base64').toString('utf8')
    const keyPem = Buffer.from(process.env.APPLE_KEY_BASE64!, 'base64').toString('utf8')
    const wwdrPem = Buffer.from(process.env.APPLE_WWDR_BASE64!, 'base64').toString('utf8')
    
    // Parse certificates with forge
    const cert = forge.pki.certificateFromPem(certPem)
    const key = forge.pki.privateKeyFromPem(keyPem)
    const wwdrCert = forge.pki.certificateFromPem(wwdrPem)
    
    // Create PKCS#7 signature with proper structure
    const p7 = forge.pkcs7.createSignedData()
    p7.content = forge.util.createBuffer(manifestBuffer.toString('binary'))
    
    p7.addCertificate(cert)
    p7.addCertificate(wwdrCert)
    
    // Create proper message digest
    const messageDigest = forge.md.sha1.create()
    messageDigest.update(manifestBuffer.toString('binary'))
    
    p7.addSigner({
      key: key,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha1,
      authenticatedAttributes: [{
        type: '1.2.840.113549.1.9.3', // contentTypes OID
        value: forge.pki.oids.data
      }, {
        type: forge.pki.oids.messageDigest,
        value: messageDigest.digest().getBytes()
      }, {
        type: forge.pki.oids.signingTime,
        value: new Date()
      }]
    })
    
    // Sign the data with detached signature
    p7.sign({ detached: true })
    
    // Convert to DER format
    const derBuffer = forge.asn1.toDer(p7.toAsn1()).getBytes()
    
    console.log('Created fallback PKCS#7 signature:', derBuffer.length, 'bytes')
    return Buffer.from(derBuffer, 'binary')
    
  } catch (error) {
    console.error('Error creating fallback signature:', error)
    throw error
  }
}

function sha1Hash(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('hex')
}

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