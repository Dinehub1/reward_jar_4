import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'
import archiver from 'archiver'
import forge from 'node-forge'
import sharp from 'sharp'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId

    console.log('Generating Apple Wallet for card ID:', customerCardId)

    // Get customer card with stamp card details
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
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

    console.log('Fetched customer card:', customerCard)

    // Handle the data structure properly - stamp_cards is an object, not an array
    const stampCardData = customerCard.stamp_cards as {
      id: string
      total_stamps: number
      name: string
      reward_description: string
      businesses: {
        name: string
        description: string
      }
    }

    const businessData = stampCardData.businesses as {
      name: string
      description: string
    }

    // Validate required data exists
    if (!stampCardData) {
      console.error('Stamp card data missing')
      return NextResponse.json(
        { error: 'Stamp card data not found' },
        { status: 404 }
      )
    }

    if (!businessData) {
      console.error('Business data missing')
      return NextResponse.json(
        { error: 'Business data not found' },
        { status: 404 }
      )
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

      // Use barcodes array (iOS 9+) with fallback to barcode (iOS 8)
      barcodes: [
        {
          message: customerCardId,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1",
          altText: `Card ID: ${customerCardId}`
        }
      ],
      
      // Legacy barcode for iOS 8 compatibility
      barcode: {
        message: customerCardId,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: `Card ID: ${customerCardId}`
      },

      locations: [],
      
      maxDistance: 1000,
      relevantDate: new Date().toISOString(),
      
      // Additional metadata for better Apple Wallet recognition
      suppressStripShine: false,
      sharingProhibited: false,
      
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
      const debugInfo = {
        passData,
        certificatesConfigured: hasAllCertificates,
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
          console.error('PKPass validation failed:', validationErrors)
          return NextResponse.json(
            { 
              error: 'PKPass validation failed',
              message: validationErrors.join(', ')
            },
            { status: 400 }
          )
        }
        
        const pkpassBuffer = await generatePKPass(passData)
        
        console.log('PKPass generated successfully:', {
          size: pkpassBuffer.length,
          sizeKB: (pkpassBuffer.length / 1024).toFixed(1)
        })
        
        return new NextResponse(pkpassBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `inline; filename="${stampCard.name.replace(/[^a-zA-Z0-9]/g, '_')}.pkpass"`,
            'Content-Transfer-Encoding': 'binary',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
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
      const icons = await generatePassIcons(null, null)
      
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
async function generatePassIcons(stampCard: any, business: any): Promise<Record<string, Buffer>> {
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
    if (!process.env.APPLE_CERT_BASE64 || !process.env.APPLE_KEY_BASE64 || !process.env.APPLE_WWDR_BASE64) {
      throw new Error('Missing Apple certificates')
    }
    
    // Import required modules
    const { exec } = require('child_process')
    const fs = require('fs')
    const path = require('path')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    // Decode certificates
    const certPem = Buffer.from(process.env.APPLE_CERT_BASE64, 'base64').toString('utf8')
    const keyPem = Buffer.from(process.env.APPLE_KEY_BASE64, 'base64').toString('utf8')
    const wwdrPem = Buffer.from(process.env.APPLE_WWDR_BASE64, 'base64').toString('utf8')
    
    // Validate certificates with forge first
    const cert = forge.pki.certificateFromPem(certPem)
    const wwdrCert = forge.pki.certificateFromPem(wwdrPem)
    
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
        } catch (e) {
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
        const bc = barcode as any
        if (!validFormats.includes(bc.format)) {
          errors.push(`Invalid barcode format: ${bc.format}`)
        }
      }
    }
  }
  
  return errors
} 