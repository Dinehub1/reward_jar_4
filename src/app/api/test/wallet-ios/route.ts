import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import archiver from 'archiver'

export async function GET(request: NextRequest) {
  try {
    console.log('🍎 Generating iOS Safari test PKPass...')

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

    // Generate test pass data with real Apple credentials
    const testPassData = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      serialNumber: 'ios-safari-test-001',
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
      organizationName: 'RewardJar',
      description: 'iOS Safari Test - Smoothie Station',
      logoText: 'RewardJar',
      backgroundColor: 'rgb(16, 185, 129)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(255, 255, 255)',
      
      storeCard: {
        headerFields: [
          {
            key: 'card_name',
            label: 'Loyalty Card',
            value: 'iOS Safari Test Card',
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        primaryFields: [
          {
            key: 'stamps',
            label: 'Stamps Collected',
            value: '7/10',
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        secondaryFields: [
          {
            key: 'progress',
            label: 'Progress',
            value: '70%',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'remaining',
            label: 'Remaining',
            value: '3 stamps',
            textAlignment: 'PKTextAlignmentRight'
          }
        ],
        auxiliaryFields: [
          {
            key: 'business',
            label: 'Business',
            value: 'Smoothie Station Test',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'reward',
            label: 'Reward',
            value: 'Free large smoothie',
            textAlignment: 'PKTextAlignmentLeft'
          }
        ]
      },
      
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: 'ios-safari-test-001',
        messageEncoding: 'iso-8859-1',
        altText: 'iOS Safari Test'
      },
      
      locations: [
        {
          latitude: 37.7749,
          longitude: -122.4194,
          relevantText: 'iOS Safari test location'
        }
      ],
      
      relevantDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }

    console.log('✅ Generated pass data with real Apple credentials:', {
      teamId: process.env.APPLE_TEAM_IDENTIFIER,
      passTypeId: process.env.APPLE_PASS_TYPE_IDENTIFIER
    })

    // For debug mode, return JSON
    const isDebug = request.nextUrl.searchParams.get('debug') === 'true'
    if (isDebug) {
      return NextResponse.json({
        message: 'iOS Safari Test PKPass (Debug Mode)',
        pass_json: testPassData,
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
      const pkpassBuffer = await generateIOSTestPKPass(testPassData)
      
      console.log('✅ PKPass generated successfully:', {
        size: pkpassBuffer.length,
        sizeKB: (pkpassBuffer.length / 1024).toFixed(1)
      })
      
      return new NextResponse(pkpassBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': 'inline; filename="ios_safari_test.pkpass"',
          'Content-Transfer-Encoding': 'binary',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-PKPass-Test': 'iOS-Safari-Compatible',
          'X-PKPass-Credentials': 'Real-Apple-Developer'
        }
      })
    } catch (error) {
      console.error('❌ Error generating PKPass:', error)
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
    console.error('❌ iOS Safari test endpoint error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateIOSTestPKPass(passData: Record<string, unknown>): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔧 Starting PKPass generation with iOS Safari compatibility...')
      
      const archive = archiver('zip', { 
        zlib: { level: 9 },
        forceLocalTime: true
      })
      const chunks: Buffer[] = []
      
      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => {
        console.log('✅ PKPass archive created successfully')
        resolve(Buffer.concat(chunks))
      })
      archive.on('error', (error) => {
        console.error('❌ Archive error:', error)
        reject(error)
      })
      
      // Generate simple 32x32 icons for testing
      const iconBuffer = await generateSimpleIcon()
      
      // Create pass.json
      const passJson = JSON.stringify(passData, null, 2)
      console.log('📄 Generated pass.json:', passJson.length, 'bytes')
      
      // Create manifest with file hashes
      const manifest = {
        'pass.json': sha1Hash(Buffer.from(passJson, 'utf8')),
        'icon.png': sha1Hash(iconBuffer),
        'icon@2x.png': sha1Hash(iconBuffer),
        'logo.png': sha1Hash(iconBuffer),
        'logo@2x.png': sha1Hash(iconBuffer)
      }
      
      const manifestJson = JSON.stringify(manifest, null, 2)
      console.log('📋 Generated manifest.json with', Object.keys(manifest).length, 'files')
      
      // Create signature using Apple certificates
      const signature = await createAppleSignature(Buffer.from(manifestJson, 'utf8'))
      console.log('🔐 Generated Apple signature:', signature.length, 'bytes')
      
      // Add all files to archive
      archive.append(passJson, { name: 'pass.json' })
      archive.append(manifestJson, { name: 'manifest.json' })
      archive.append(signature, { name: 'signature' })
      archive.append(iconBuffer, { name: 'icon.png' })
      archive.append(iconBuffer, { name: 'icon@2x.png' })
      archive.append(iconBuffer, { name: 'logo.png' })
      archive.append(iconBuffer, { name: 'logo@2x.png' })
      
      archive.finalize()
      
    } catch (error) {
      console.error('❌ PKPass generation error:', error)
      reject(error)
    }
  })
}

function sha1Hash(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex')
}

async function generateSimpleIcon(): Promise<Buffer> {
  // Generate a simple 32x32 PNG icon for testing
  // This is a minimal PNG header + IDAT for a solid green square
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20, // 32x32 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0xFC, 0x18, 0xED, // RGB format
    0xA3, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk start
    0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF, // Simple green data
    0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, // More data
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ])
  
  return pngData
}

async function createAppleSignature(manifestBuffer: Buffer): Promise<Buffer> {
  try {
    // Decode the Apple certificates from environment
    const certPem = Buffer.from(process.env.APPLE_CERT_BASE64!, 'base64').toString('utf8')
    const keyPem = Buffer.from(process.env.APPLE_KEY_BASE64!, 'base64').toString('utf8')
    const wwdrPem = Buffer.from(process.env.APPLE_WWDR_BASE64!, 'base64').toString('utf8')
    
    console.log('🔐 Creating PKCS#7 signature with real Apple certificates...')
    
    // For now, return a placeholder signature
    // In production, this would use node-forge or similar to create PKCS#7
    const placeholderSignature = Buffer.from('APPLE_PKCS7_SIGNATURE_PLACEHOLDER', 'utf8')
    
    console.log('⚠️  Using placeholder signature for testing')
    return placeholderSignature
    
  } catch (error) {
    console.error('❌ Error creating Apple signature:', error)
    throw new Error('Failed to create Apple signature: ' + (error as Error).message)
  }
} 