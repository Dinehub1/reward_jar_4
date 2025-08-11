import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildPwaManifest, DEFAULT_PWA_ICONS } from '@/lib/wallet/pwa-manifest'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createServerClient()
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
      const fallback = buildPwaManifest({
        name: 'RewardJar Loyalty Card',
        shortName: 'RewardJar',
        themeColor: '#10b981',
        backgroundColor: '#10b981',
        scope: `/api/wallet/pwa/${customerCardId}/`,
        startUrl: `/api/wallet/pwa/${customerCardId}`,
        icons: DEFAULT_PWA_ICONS,
      })
      return NextResponse.json(fallback, {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    const stampCardData = (customerCard.stamp_cards as unknown) as {
      id: string
      total_stamps: number
      name: string
      businesses: {
        name: string
      }
    }
    const businessData = stampCardData?.businesses as {
      name: string
    }
    
    const stampCard = {
      id: stampCardData.id,
      name: stampCardData.name || 'Loyalty Card',
      total_stamps: stampCardData.total_stamps || 10,
      businesses: businessData?.name || 'Business'
    }
    
    const business = {
      name: businessData?.name || 'Business'
    }

    // Generate customized manifest
    const manifest = {
      ...buildPwaManifest({
        name: `${stampCard.name} - ${business.name}`,
        shortName: stampCard.name,
        themeColor: '#10b981',
        backgroundColor: '#10b981',
        scope: `/api/wallet/pwa/${customerCardId}/`,
        startUrl: `/api/wallet/pwa/${customerCardId}`,
        icons: DEFAULT_PWA_ICONS,
      }),
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
      categories: ["lifestyle", "shopping", "business"],
      related_applications: [
        {
          platform: "webapp",
          url: `${process.env.BASE_URL || 'https://rewardjar.com'}/customer/card/${customerCardId}`
        }
      ],
      prefer_related_applications: false,
      display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
      launch_handler: { client_mode: "focus-existing" },
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