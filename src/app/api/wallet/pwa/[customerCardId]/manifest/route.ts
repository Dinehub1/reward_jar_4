import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId

    // Get customer card details for manifest customization
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        stamp_cards!inner (
          id,
          name,
          total_stamps,
          businesses!inner (
            name
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      // Return default manifest if card not found
      const defaultManifest = {
        name: "RewardJar Loyalty Card",
        short_name: "RewardJar",
        description: "Your digital loyalty card",
        start_url: `/api/wallet/pwa/${customerCardId}`,
        display: "standalone",
        background_color: "#10b981",
        theme_color: "#10b981",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512", 
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
      
      return NextResponse.json(defaultManifest, {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    const stampCard = customerCard.stamp_cards as any
    const business = stampCard.businesses as any

    // Generate customized manifest
    const manifest = {
      name: `${stampCard.name} - ${business.name}`,
      short_name: stampCard.name,
      description: `Your ${stampCard.name} loyalty card from ${business.name}`,
      start_url: `/api/wallet/pwa/${customerCardId}`,
      display: "standalone",
      background_color: "#10b981",
      theme_color: "#10b981",
      orientation: "portrait",
      scope: `/api/wallet/pwa/${customerCardId}/`,
      
      // Dynamic icons based on stamp progress
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png", 
          purpose: "any maskable"
        }
      ],
      
      // Useful shortcuts
      shortcuts: [
        {
          name: "View Card",
          url: `/customer/card/${customerCardId}`,
          description: "View your loyalty card details",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192"
            }
          ]
        },
        {
          name: "Business Profile",
          url: `/business/${stampCard.businesses}`,
          description: `Visit ${business.name} profile`,
          icons: [
            {
              src: "/icons/icon-192x192.png", 
              sizes: "192x192"
            }
          ]
        }
      ],
      
      // Categories for app store classification
      categories: ["lifestyle", "shopping", "business"],
      
      // Related applications
      related_applications: [
        {
          platform: "webapp",
          url: `${process.env.BASE_URL || 'https://rewardjar.com'}/customer/card/${customerCardId}`
        }
      ],
      
      // PWA features
      prefer_related_applications: false,
      display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
      
      // Launch handler for file associations
      launch_handler: {
        client_mode: "focus-existing"
      }
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Error generating PWA manifest:', error)
    
    // Return minimal fallback manifest
    const fallbackManifest = {
      name: "RewardJar Loyalty Card",
      short_name: "RewardJar",
      start_url: "/",
      display: "standalone",
      background_color: "#10b981",
      theme_color: "#10b981",
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        }
      ]
    }
    
    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json'
      }
    })
  }
} 