import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * POST /api/onboarding/upload-logo
 * 
 * Securely uploads business logo using server-side admin Supabase client
 * Uses createAdminClient for proper storage bucket access and permissions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ LOGO UPLOAD API - Starting logo upload process')

    // Get the uploaded file from FormData
    const formData = await request.formData()
    const file = formData.get('logo') as File
    const userId = formData.get('userId') as string

    if (!file) {
      console.error('❌ LOGO UPLOAD API - No file provided')
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      console.error('❌ LOGO UPLOAD API - No user ID provided')
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ LOGO UPLOAD API - Invalid file type:', file.type)
      return NextResponse.json(
        { success: false, error: 'Please upload an image file (PNG, JPG, etc.)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ LOGO UPLOAD API - File too large:', file.size)
      return NextResponse.json(
        { success: false, error: 'Logo file must be smaller than 5MB' },
        { status: 400 }
      )
    }

    console.log('✅ LOGO UPLOAD API - File validation passed:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Create server-side admin Supabase client for storage operations
    const supabase = createAdminClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    
    console.log('📁 LOGO UPLOAD API - Generated filename:', fileName)

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-logos')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ LOGO UPLOAD API - Storage upload failed:', uploadError)
      
      // Check if bucket exists, if not create it
      if (uploadError.message.includes('Bucket not found')) {
        console.log('🪣 LOGO UPLOAD API - Attempting to create business-logos bucket')
        
        const { error: bucketError } = await supabase.storage
          .createBucket('business-logos', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880, // 5MB
            avifAutoDetection: false
          })

        if (bucketError) {
          console.error('❌ LOGO UPLOAD API - Failed to create bucket:', bucketError)
          return NextResponse.json(
            { success: false, error: 'Storage configuration error. Please contact support.' },
            { status: 500 }
          )
        }

        // Retry upload after bucket creation
        const { data: retryUploadData, error: retryUploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, uint8Array, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (retryUploadError) {
          console.error('❌ LOGO UPLOAD API - Retry upload failed:', retryUploadError)
          return NextResponse.json(
            { success: false, error: 'Failed to upload logo after bucket creation' },
            { status: 500 }
          )
        }

        console.log('✅ LOGO UPLOAD API - Retry upload successful:', retryUploadData)
      } else {
        return NextResponse.json(
          { success: false, error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }
    }

    console.log('✅ LOGO UPLOAD API - Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('business-logos')
      .getPublicUrl(fileName)

    console.log('🔗 LOGO UPLOAD API - Public URL generated:', publicUrl)

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        publicUrl,
        fileSize: file.size,
        fileType: file.type
      },
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('❌ LOGO UPLOAD API - Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during logo upload' },
      { status: 500 }
    )
  }
}