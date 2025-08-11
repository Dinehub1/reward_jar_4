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

    // Get the uploaded file from FormData
    const formData = await request.formData()
    const file = formData.get('logo') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Please upload an image file (PNG, JPG, etc.)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Logo file must be smaller than 5MB' },
        { status: 400 }
      )
    }

      name: file.name,
      type: file.type,
      size: file.size
    })

    // Create server-side admin Supabase client for storage operations
    const supabase = createAdminClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    

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
      
      // Check if bucket exists, if not create it
      if (uploadError.message.includes('Bucket not found')) {
        
        const { error: bucketError } = await supabase.storage
          .createBucket('business-logos', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
          })

        if (bucketError) {
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
          return NextResponse.json(
            { success: false, error: 'Failed to upload logo after bucket creation' },
            { status: 500 }
          )
        }

      } else {
        return NextResponse.json(
          { success: false, error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }
    }


    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('business-logos')
      .getPublicUrl(fileName)


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
    return NextResponse.json(
      { success: false, error: 'Internal server error during logo upload' },
      { status: 500 }
    )
  }
}