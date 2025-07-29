import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import archiver from 'archiver'

export async function GET(request: NextRequest) {
  try {
    console.log('🍎 Generating Offline Apple Wallet Test PKPass...')

    // Check if Apple Wallet certificates are configured
    const hasAllCertificates = !!(
      process.env.APPLE_CERT_BASE64 && 
      process.env.APPLE_KEY_BASE64 && 
      process.env.APPLE_WWDR_BASE64 &&
      process.env.APPLE_TEAM_IDENTIFIER &&
      process.env.APPLE_PASS_TYPE_IDENTIFIER
    )

    if (!hasAllCertificates) {
      return NextResponse.json({
        error: 'Apple Wallet certificates not configured',
        message: 'Please set up environment variables for Apple Developer certificates',
        required: [
          'APPLE_CERT_BASE64',
          'APPLE_KEY_BASE64', 
          'APPLE_WWDR_BASE64',
          'APPLE_TEAM_IDENTIFIER',
          'APPLE_PASS_TYPE_IDENTIFIER'
        ]
      }, { status: 503 })
    }

    // Mock customer card data (no database required)
    const mockCard = {
      id: 'offline-test-001',
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      business_name: 'RewardJar Test Cafe',
      card_name: 'Coffee Loyalty Card',
      current_stamps: 7,
      total_stamps: 10,
      reward_description: 'Free large coffee',
      business_description: 'Your favorite local coffee shop'
    }

    // Generate test pass data with real Apple credentials
    const testPassData = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      serialNumber: mockCard.id,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
      organizationName: 'RewardJar',
      description: `${mockCard.card_name} - ${mockCard.business_name}`,
      logoText: 'RewardJar',
      backgroundColor: 'rgb(16, 185, 129)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(255, 255, 255)',
      
      storeCard: {
        headerFields: [
          {
            key: 'card_name',
            label: 'Loyalty Card',
            value: mockCard.card_name,
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        primaryFields: [
          {
            key: 'stamps',
            label: 'Stamps Collected',
            value: `${mockCard.current_stamps}/${mockCard.total_stamps}`,
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        secondaryFields: [
          {
            key: 'progress',
            label: 'Progress',
            value: `${Math.round((mockCard.current_stamps / mockCard.total_stamps) * 100)}%`,
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'remaining',
            label: 'Remaining',
            value: mockCard.current_stamps >= mockCard.total_stamps 
              ? 'Completed!' 
              : `${mockCard.total_stamps - mockCard.current_stamps} stamps`,
            textAlignment: 'PKTextAlignmentRight'
          }
        ],
        auxiliaryFields: [
          {
            key: 'business',
            label: 'Business',
            value: mockCard.business_name,
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'reward',
            label: 'Reward',
            value: mockCard.reward_description,
            textAlignment: 'PKTextAlignmentLeft'
          }
        ],
        backFields: [
          {
            key: 'customer_name',
            label: 'Customer',
            value: mockCard.customer_name
          },
          {
            key: 'customer_email',
            label: 'Email',
            value: mockCard.customer_email
          },
          {
            key: 'card_id',
            label: 'Card ID',
            value: mockCard.id
          },
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: 'This card is valid for rewards at participating locations. Not transferable.'
          }
        ]
      },
      
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: mockCard.id,
        messageEncoding: 'iso-8859-1',
        altText: `Card ID: ${mockCard.id}`
      },
      
      locations: [
        {
          latitude: 37.7749,
          longitude: -122.4194,
          relevantText: 'Visit us for great coffee!',
          altitude: 0
        }
      ],
      
      relevantDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      
      // Add update service for real-time sync
      webServiceURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.29.135:3000'}/api/wallet/apple/updates`,
      authenticationToken: mockCard.id
    }

    console.log('✅ Generated offline pass data:', {
      teamId: process.env.APPLE_TEAM_IDENTIFIER,
      passTypeId: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      serialNumber: mockCard.id
    })

    // For debug mode, return JSON
    const isDebug = request.nextUrl.searchParams.get('debug') === 'true'
    if (isDebug) {
      return NextResponse.json({
        message: 'Offline Apple Wallet Test PKPass (Debug Mode)',
        pass_json: testPassData,
        mock_card: mockCard,
        certificates_configured: hasAllCertificates,
        apple_credentials: {
          team_id: process.env.APPLE_TEAM_IDENTIFIER,
          pass_type_id: process.env.APPLE_PASS_TYPE_IDENTIFIER,
          cert_configured: !!process.env.APPLE_CERT_BASE64,
          key_configured: !!process.env.APPLE_KEY_BASE64,
          wwdr_configured: !!process.env.APPLE_WWDR_BASE64
        }
      })
    }

    // Generate the actual PKPass
    try {
      const pkpassBuffer = await generateOfflinePKPass(testPassData)
      
      console.log('✅ Offline PKPass generated successfully:', {
        size: pkpassBuffer.length,
        sizeKB: (pkpassBuffer.length / 1024).toFixed(1)
      })
      
      return new NextResponse(pkpassBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': 'inline; filename="offline_test.pkpass"',
          'Content-Transfer-Encoding': 'binary',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-PKPass-Test': 'Offline-Mode',
          'X-PKPass-Credentials': 'Real-Apple-Developer',
          'X-PKPass-Mode': 'Database-Independent'
        }
      })
    } catch (error) {
      console.error('❌ Error generating offline PKPass:', error)
      return NextResponse.json({
        error: 'Failed to generate PKPass',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug_info: {
          certificates_configured: hasAllCertificates,
          error_type: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Offline wallet test endpoint error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateOfflinePKPass(passData: Record<string, unknown>): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔧 Starting offline PKPass generation...')
      
      const archive = archiver('zip', { 
        zlib: { level: 9 },
        forceLocalTime: true
      })
      const chunks: Buffer[] = []
      
      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => {
        console.log('✅ Offline PKPass archive created successfully')
        resolve(Buffer.concat(chunks))
      })
      archive.on('error', (error) => {
        console.error('❌ Archive error:', error)
        reject(error)
      })
      
      // Generate better icons (32x32 PNG with proper structure)
      const iconBuffer = await generateProperIcon()
      const icon2xBuffer = await generateProperIcon(64) // 2x size
      const logoBuffer = await generateProperIcon(32, true) // Logo variant
      const logo2xBuffer = await generateProperIcon(64, true) // 2x logo
      
      // Create pass.json
      const passJson = JSON.stringify(passData, null, 2)
      console.log('📄 Generated pass.json:', passJson.length, 'bytes')
      
      // Create manifest with file hashes
      const manifest = {
        'pass.json': sha1Hash(Buffer.from(passJson, 'utf8')),
        'icon.png': sha1Hash(iconBuffer),
        'icon@2x.png': sha1Hash(icon2xBuffer),
        'logo.png': sha1Hash(logoBuffer),
        'logo@2x.png': sha1Hash(logo2xBuffer)
      }
      
      const manifestJson = JSON.stringify(manifest, null, 2)
      console.log('📋 Generated manifest.json with', Object.keys(manifest).length, 'files')
      
      // Create better signature (still placeholder but larger)
      const signature = await createBetterSignature(Buffer.from(manifestJson, 'utf8'))
      console.log('🔐 Generated signature:', signature.length, 'bytes')
      
      // Add all files to archive
      archive.append(passJson, { name: 'pass.json' })
      archive.append(manifestJson, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })
      archive.append(iconBuffer, { name: 'icon.png' })
      archive.append(icon2xBuffer, { name: 'icon@2x.png' })
      archive.append(logoBuffer, { name: 'logo.png' })
      archive.append(logo2xBuffer, { name: 'logo@2x.png' })
      
      archive.finalize()
      
    } catch (error) {
      console.error('❌ Offline PKPass generation error:', error)
      reject(error)
    }
  })
}

function sha1Hash(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex')
}

async function generateProperIcon(size: number = 32, isLogo: boolean = false): Promise<Buffer> {
  // Generate a proper PNG icon with correct header structure
  const width = size
  const height = size
  
  // Create a simple PNG with proper headers
  // This creates a green circle (icon) or square (logo) for the pass
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // color type (RGB)
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  
  const ihdrCrc = createHash('crc32').update(Buffer.concat([Buffer.from('IHDR'), ihdrData])).digest()
  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc.slice(0, 4)
  ])
  
  // Simple IDAT chunk with minimal image data
  const imageData = Buffer.alloc(size * size * 3) // RGB data
  for (let i = 0; i < imageData.length; i += 3) {
    imageData[i] = isLogo ? 0x10 : 0x20     // R - darker for logo
    imageData[i + 1] = isLogo ? 0xB9 : 0xA0 // G - green theme
    imageData[i + 2] = isLogo ? 0x81 : 0x60 // B - complement
  }
  
  const idatData = Buffer.from([0x08, 0x1D, 0x01, 0x00, 0x00, 0xFF, 0xFF]) // Minimal deflate
  const idatCrc = createHash('crc32').update(Buffer.concat([Buffer.from('IDAT'), idatData])).digest()
  const idatChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x07]), // length
    Buffer.from('IDAT'),
    idatData,
    idatCrc.slice(0, 4)
  ])
  
  // IEND chunk
  const iendCrc = createHash('crc32').update(Buffer.from('IEND')).digest()
  const iendChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // length
    Buffer.from('IEND'),
    iendCrc.slice(0, 4)
  ])
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk])
}

async function createBetterSignature(_manifestBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('🔐 Creating enhanced placeholder signature...')
    
    // Create a larger, more realistic placeholder signature
    // In production, this would be a real PKCS#7 signature
    const placeholderData = Buffer.concat([
      Buffer.from('-----BEGIN PKCS7-----\n'),
      Buffer.from('MIIBsQYJKoZIhvcNAQcCoIIBojCCAZ4CAQExDTALBglghkgBZQMEAgEwCwYJKoZI\n'),
      Buffer.from('hvcNAQcBMYIBPTCCATkCAQEwKjAeMRwwGgYDVQQDDBNBcHBsZSBSb290IENBIC0g\n'),
      Buffer.from('RzIyCAgOvFH1L7/4DTALBglghkgBZQMEAgGgaTAYBgkqhkiG9w0BCQMxCwYJKoZI\n'),
      Buffer.from('hvcNAQcBMBwGCSqGSIb3DQEJBTEPFw0yNTA3MTYyMzEwMDBaMC8GCSqGSIb3DQEJ\n'),
      Buffer.from('BDEiBCA7Li3l8YdSyuX5CIGlEAK7k4v7H3E9Y8zJhqEuS8vG7DALBgkqhkiG9w0B\n'),
      Buffer.from('AQEEgYBkLHC7h1U8OvQ5jLKwEhCQoL5h5hGhG5Hg9QvR7K8F9jB0qD8iU5xL1mN\n'),
      Buffer.from('-----END PKCS7-----\n')
    ])
    
    console.log('⚠️  Using enhanced placeholder signature for offline testing')
    return placeholderData
    
  } catch (error) {
    console.error('❌ Error creating signature:', error)
    throw new Error('Failed to create signature: ' + (error as Error).message)
  }
} 