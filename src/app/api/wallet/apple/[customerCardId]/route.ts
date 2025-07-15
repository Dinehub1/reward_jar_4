import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'
import archiver from 'archiver'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId

    // Get customer card with stamp card details
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        wallet_type,
        created_at,
        stamp_cards!inner (
          id,
          name,
          total_stamps,
          reward_description,
          businesses!inner (
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

    const stampCard = customerCard.stamp_cards as any
    const business = stampCard.businesses as any
    
    // Calculate progress
    const progress = Math.min((customerCard.current_stamps / stampCard.total_stamps) * 100, 100)
    const isCompleted = customerCard.current_stamps >= stampCard.total_stamps
    const stampsRemaining = Math.max(stampCard.total_stamps - customerCard.current_stamps, 0)

    // Check if Apple Wallet is configured
    if (!process.env.APPLE_TEAM_IDENTIFIER || !process.env.APPLE_PASS_TYPE_IDENTIFIER) {
      return NextResponse.json(
        { 
          error: 'Apple Wallet not configured', 
          message: 'Please contact support for Apple Wallet integration'
        },
        { status: 503 }
      )
    }

    // Generate Apple Wallet pass JSON
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      serialNumber: customerCardId,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
      organizationName: "RewardJar",
      description: `${stampCard.name} - ${business.name}`,
      logoText: "RewardJar",
      backgroundColor: "rgb(16, 185, 129)", // green-500
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(255, 255, 255)",
      
      storeCard: {
        primaryFields: [
          {
            key: "stamps",
            label: "Stamps Collected",
            value: `${customerCard.current_stamps}/${stampCard.total_stamps}`,
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
            label: isCompleted ? "Status" : "Remaining",
            value: isCompleted ? "Completed!" : `${stampsRemaining} stamps`,
            textAlignment: "PKTextAlignmentRight"
          }
        ],
        auxiliaryFields: [
          {
            key: "business",
            label: "Business",
            value: business.name,
            textAlignment: "PKTextAlignmentLeft"
          },
          {
            key: "reward",
            label: "Reward",
            value: stampCard.reward_description,
            textAlignment: "PKTextAlignmentLeft"
          }
        ],
        headerFields: [
          {
            key: "card_name",
            label: "Loyalty Card",
            value: stampCard.name,
            textAlignment: "PKTextAlignmentCenter"
          }
        ],
        backFields: [
          {
            key: "description",
            label: "About",
            value: `Collect ${stampCard.total_stamps} stamps to earn: ${stampCard.reward_description}`
          },
          {
            key: "business_info",
            label: business.name,
            value: business.description || "Visit us to collect stamps and earn rewards!"
          },
          {
            key: "instructions",
            label: "How to Use",
            value: "Show this pass to collect stamps at participating locations. Your pass will automatically update when new stamps are added."
          },
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
        altText: `Card ID: ${customerCardId}`
      },

      locations: [],
      
      maxDistance: 1000,
      relevantDate: new Date().toISOString(),
      
      webServiceURL: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/updates`,
      authenticationToken: customerCardId,
      
      associatedStoreIdentifiers: [],
      
      userInfo: {
        customerCardId: customerCardId,
        stampCardId: stampCard.id,
        businessName: business.name
      }
    }

    // Check if we have all required certificates for PKPass generation
    const hasAllCertificates = process.env.APPLE_CERT_BASE64 && 
                              process.env.APPLE_KEY_BASE64 && 
                              process.env.APPLE_WWDR_BASE64

    // For debugging, return JSON
    if (request.nextUrl.searchParams.get('debug') === 'true') {
      return NextResponse.json({
        passData,
        certificatesConfigured: hasAllCertificates,
        environment: {
          teamIdentifier: !!process.env.APPLE_TEAM_IDENTIFIER,
          passTypeIdentifier: !!process.env.APPLE_PASS_TYPE_IDENTIFIER,
          certificates: hasAllCertificates
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // If certificates are configured, generate actual PKPass
    if (hasAllCertificates) {
      try {
        const pkpassBuffer = await generatePKPass(passData)
        
        return new NextResponse(pkpassBuffer, {
          headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="${stampCard.name.replace(/[^a-zA-Z0-9]/g, '_')}.pkpass"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
      } catch (error) {
        console.error('Error generating PKPass:', error)
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
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div class="text-center mb-6">
            <div class="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 4l-3 3-3-3 3-3 3 3z"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 mb-2">Apple Wallet Integration</h1>
            <p class="text-gray-600">Apple Wallet passes require additional setup</p>
        </div>
        
        <div class="space-y-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold text-blue-900 mb-2">Required Setup:</h3>
                <ul class="text-sm text-blue-800 space-y-1">
                    <li>• Apple Developer Account</li>
                    <li>• Pass Type ID Certificate</li>
                    <li>• Signing certificates</li>
                    <li>• Web service configuration</li>
                </ul>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 class="font-semibold text-green-900 mb-2">Alternative Options:</h3>
                <div class="space-y-2">
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
    console.error('Error generating Apple Wallet pass:', error)
    return NextResponse.json(
      { error: 'Failed to generate Apple Wallet pass' },
      { status: 500 }
    )
  }
}

// PKPass generation helper functions
async function generatePKPass(passData: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const chunks: Buffer[] = []
      
      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)
      
      // Create pass.json
      const passJson = JSON.stringify(passData, null, 2)
      
      // Create manifest.json with file checksums
      const manifest = {
        'pass.json': sha1Hash(Buffer.from(passJson))
      }
      const manifestJson = JSON.stringify(manifest, null, 2)
      
      // Create signature (simplified for development)
      // In production, this would use actual certificate signing
      const signature = createDevelopmentSignature()
      
      // Add files to archive
      archive.append(passJson, { name: 'pass.json' })
      archive.append(manifestJson, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })
      
      archive.finalize()
    } catch (error) {
      reject(error)
    }
  })
}

function sha1Hash(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('hex')
}

function createDevelopmentSignature(): Buffer {
  // In development, create a placeholder signature
  // In production, this would use OpenSSL with actual certificates
  if (process.env.NODE_ENV === 'production' && 
      process.env.APPLE_CERT_BASE64 && 
      process.env.APPLE_KEY_BASE64 && 
      process.env.APPLE_WWDR_BASE64) {
    
    // TODO: Implement actual certificate signing with OpenSSL
    // This requires: pass certificate, private key, WWDR certificate
    const placeholderSignature = 'PRODUCTION_SIGNATURE_PLACEHOLDER'
    return Buffer.from(placeholderSignature, 'utf8')
  }
  
  // Development placeholder
  return Buffer.from('DEVELOPMENT_SIGNATURE_PLACEHOLDER', 'utf8')
} 