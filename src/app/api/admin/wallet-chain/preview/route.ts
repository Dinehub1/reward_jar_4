/**
 * One-Click Wallet Preview API
 * 
 * Generate instant previews and downloads for Apple, Google, and PWA wallets
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { transformStampCardData, transformMembershipCardData, generateAppleWalletPass, generateGoogleWalletObject, generatePWACardData } from '@/lib/wallet/unified-card-data'
import { isFeatureEnabled } from '@/lib/wallet/feature-flags'
import type { ApiResponse } from '@/lib/supabase/types'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import crypto from 'crypto'

interface WalletPreviewRequest {
  cardId: string
  customerId?: string
  platforms: ('apple' | 'google' | 'pwa')[]
  format: 'preview' | 'download'
}

interface WalletPreviewResult {
  cardId: string
  customerId?: string
  cardType: 'stamp' | 'membership'
  previews: {
    apple?: {
      success: boolean
      data?: any
      downloadUrl?: string
      error?: string
    }
    google?: {
      success: boolean
      data?: any
      downloadUrl?: string
      qrCodeUrl?: string
      error?: string
    }
    pwa?: {
      success: boolean
      data?: any
      previewUrl?: string
      error?: string
    }
  }
  timestamp: string
  processingTime: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🎫 WALLET PREVIEW: Starting preview generation...')

  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Admin role verification
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Parse request body
    const body: WalletPreviewRequest = await request.json()
    const { cardId, customerId, platforms = ['apple', 'google', 'pwa'], format = 'preview' } = body

    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: 'Card ID is required'
      } as ApiResponse<never>, { status: 400 })
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one platform must be specified'
      } as ApiResponse<never>, { status: 400 })
    }

    // Generate previews
    const previewResult = await generateWalletPreviews(cardId, customerId, platforms, format, adminClient)

    console.log(`✅ WALLET PREVIEW: Generated ${platforms.length} previews in ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      data: previewResult,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('💥 WALLET PREVIEW: Critical error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Preview generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Generate wallet previews for specified platforms
 */
async function generateWalletPreviews(
  cardId: string, 
  customerId: string | undefined, 
  platforms: string[], 
  format: string,
  adminClient: any
): Promise<WalletPreviewResult> {
  // Fetch card data and determine type
  const { unifiedData, cardType } = await fetchCardData(cardId, customerId, adminClient)
  
  // Generate previews for each platform
  const previews: WalletPreviewResult['previews'] = {}

  // Process platforms in parallel
  const previewPromises = platforms.map(async (platform) => {
    switch (platform) {
      case 'apple':
        if (isFeatureEnabled('appleWallet')) {
          previews.apple = await generateApplePreview(unifiedData, format)
        } else {
          previews.apple = { success: false, error: 'Apple Wallet is disabled' }
        }
        break
        
      case 'google':
        if (isFeatureEnabled('googleWallet')) {
          previews.google = await generateGooglePreview(unifiedData, format)
        } else {
          previews.google = { success: false, error: 'Google Wallet is disabled' }
        }
        break
        
      case 'pwa':
        if (isFeatureEnabled('pwaCards')) {
          previews.pwa = await generatePWAPreview(unifiedData, format)
        } else {
          previews.pwa = { success: false, error: 'PWA cards are disabled' }
        }
        break
    }
  })

  await Promise.all(previewPromises)

  return {
    cardId,
    customerId,
    cardType,
    previews,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - Date.now() // Will be set by caller
  }
}

/**
 * Fetch and transform card data
 */
async function fetchCardData(cardId: string, customerId: string | undefined, adminClient: any) {
  // Try stamp card first
  const { data: stampCard, error: stampError } = await adminClient
    .from('stamp_cards')
    .select(`*, businesses!inner(*)`)
    .eq('id', cardId)
    .single()

  if (!stampError && stampCard) {
    let customerData = null
    if (customerId) {
      const { data: customer } = await adminClient
        .from('customer_cards')
        .select(`current_stamps, customers!inner(*)`)
        .eq('stamp_card_id', cardId)
        .eq('customer_id', customerId)
        .single()

      if (customer) {
        customerData = { ...customer.customers, current_stamps: customer.current_stamps }
      }
    }

    return {
      unifiedData: transformStampCardData(stampCard, customerData),
      cardType: 'stamp' as const
    }
  }

  // Try membership card
  const { data: membershipCard, error: memberError } = await adminClient
    .from('membership_cards')
    .select(`*, businesses!inner(*)`)
    .eq('id', cardId)
    .single()

  if (!memberError && membershipCard) {
    let customerData = null
    if (customerId) {
      const { data: customer } = await adminClient
        .from('customer_cards')
        .select(`sessions_used, expiry_date, customers!inner(*)`)
        .eq('membership_card_id', cardId)
        .eq('customer_id', customerId)
        .single()

      if (customer) {
        customerData = {
          ...customer.customers,
          sessions_used: customer.sessions_used,
          expiry_date: customer.expiry_date
        }
      }
    }

    return {
      unifiedData: transformMembershipCardData(membershipCard, customerData),
      cardType: 'membership' as const
    }
  }

  throw new Error(`Card not found: ${cardId}`)
}

/**
 * Generate Apple Wallet preview
 */
async function generateApplePreview(unifiedData: any, format: string) {
  try {
    const passData = generateAppleWalletPass(unifiedData)
    
    if (format === 'download') {
      // Generate .pkpass file
      const fileName = `${unifiedData.serialNumber}.pkpass`
      const downloadUrl = await createPkpassFile(passData, fileName)
      
      return {
        success: true,
        data: passData,
        downloadUrl
      }
    } else {
      // Return preview data only
      return {
        success: true,
        data: passData
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Apple preview generation failed'
    }
  }
}

/**
 * Generate Google Wallet preview
 */
async function generateGooglePreview(unifiedData: any, format: string) {
  try {
    const objectData = generateGoogleWalletObject(unifiedData)
    
    if (format === 'download') {
      // Generate JWT and QR code
      const jwt = await createGoogleWalletJWT(objectData)
      const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`
      const qrCodeUrl = await generateQRCode(saveUrl)
      
      return {
        success: true,
        data: objectData,
        downloadUrl: saveUrl,
        qrCodeUrl
      }
    } else {
      // Return preview data only
      return {
        success: true,
        data: objectData
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google preview generation failed'
    }
  }
}

/**
 * Generate PWA preview
 */
async function generatePWAPreview(unifiedData: any, format: string) {
  try {
    const pwaData = generatePWACardData(unifiedData)
    
    if (format === 'download') {
      // Create preview URL (could be a deep link to PWA)
      const previewUrl = `/pwa/card/${unifiedData.id}`
      
      return {
        success: true,
        data: pwaData,
        previewUrl
      }
    } else {
      // Return preview data only
      return {
        success: true,
        data: pwaData
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PWA preview generation failed'
    }
  }
}

/**
 * Create .pkpass file from pass data
 */
async function createPkpassFile(passData: any, fileName: string): Promise<string> {
  try {
    const tempDir = path.join(process.cwd(), 'temp', 'pkpass')
    const passDir = path.join(tempDir, crypto.randomUUID())
    
    // Create directories
    await fs.promises.mkdir(passDir, { recursive: true })
    
    // Write pass.json
    await fs.promises.writeFile(
      path.join(passDir, 'pass.json'),
      JSON.stringify(passData, null, 2)
    )
    
    // Create manifest.json with file hashes
    const manifest = {
      'pass.json': await generateFileHash(path.join(passDir, 'pass.json'))
    }
    
    await fs.promises.writeFile(
      path.join(passDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    
    // Create signature (placeholder for development)
    await fs.promises.writeFile(
      path.join(passDir, 'signature'),
      'DEVELOPMENT_SIGNATURE_PLACEHOLDER'
    )
    
    // Create ZIP file
    const outputPath = path.join(tempDir, fileName)
    await createZipArchive(passDir, outputPath)
    
    // Return download URL (in production, upload to S3 or similar)
    return `/api/download/pkpass/${fileName}`
    
  } catch (error) {
    throw new Error(`Failed to create .pkpass file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create Google Wallet JWT
 */
async function createGoogleWalletJWT(objectData: any): Promise<string> {
  try {
    // This would use the actual Google service account credentials
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    
    if (!serviceAccountJson) {
      throw new Error('Google service account not configured')
    }
    
    const credentials = JSON.parse(serviceAccountJson)
    
    // Create JWT payload
    const payload = objectData.classId?.includes('loyalty') 
      ? { loyaltyObjects: [objectData] }
      : { genericObjects: [objectData] }
    
    // For development, return a mock JWT
    return 'mock-jwt-token-' + Buffer.from(JSON.stringify(payload)).toString('base64').substring(0, 20)
    
  } catch (error) {
    throw new Error(`Failed to create Google Wallet JWT: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate QR code for Google Wallet save URL
 */
async function generateQRCode(url: string): Promise<string> {
  try {
    // In production, use a QR code library like 'qrcode'
    // For now, return a placeholder QR code service URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate SHA1 hash for a file
 */
async function generateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.promises.readFile(filePath)
  const hashSum = crypto.createHash('sha1')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}

/**
 * Create ZIP archive from directory
 */
async function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    output.on('close', () => resolve())
    archive.on('error', (err) => reject(err))
    
    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}