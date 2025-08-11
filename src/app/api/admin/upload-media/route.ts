import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

/**
 * POST /api/admin/upload-media
 * 
 * Securely uploads media files (logos, icons) for card creation
 * Uses createAdminClient for proper storage bucket access and permissions
 */
export async function POST(request: NextRequest) {
  try {

    // Get the uploaded file from FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null // 'logo' or 'icon'
    const businessId = formData.get('businessId') as string | null

    if (!file || !type || !businessId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing file, type, or business ID.' 
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size exceeds 5MB limit.' 
      }, { status: 400 })
    }

      name: file.name,
      type: file.type,
      size: file.size,
      uploadType: type,
      businessId
    })

    // Create server-side admin Supabase client for storage operations
    const supabase = createAdminClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${businessId}-${type}-${Date.now()}.${fileExt}`
    const bucketName = type === 'logo' ? 'business-logos' : 'card-icons'
    
    // Upload file to appropriate Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      
      // Check if bucket exists, if not create it
      if (uploadError.message.includes('Bucket not found')) {
        
        const { error: bucketError } = await supabase.storage
          .createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'],
            fileSizeLimit: 5242880 // 5MB
          })

        if (bucketError) {
          return NextResponse.json(
            { success: false, error: 'Storage configuration error. Please contact support.' },
            { status: 500 }
          )
        }
        
        // Instruct client to retry upload after bucket creation
        return NextResponse.json(
          { success: false, error: 'Storage bucket created. Please retry your upload.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: false, 
        error: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    
    return NextResponse.json({ 
      success: true, 
      data: { 
        publicUrl,
        fileName,
        bucketName,
        type
      } 
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}