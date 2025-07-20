import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  const { customerCardId } = await params
  
  const manifest = {
    "name": "Gym Membership - RewardJar",
    "short_name": "Membership", 
    "description": "Your gym membership card with session tracking",
    "start_url": `/api/wallet/pwa/membership/${customerCardId}`,
    "display": "standalone",
    "background_color": "#10b981",
    "theme_color": "#10b981",
    "orientation": "portrait",
    "scope": "/",
    "icons": [
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/icons/icon-512x512.png", 
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ],
    "shortcuts": [
      {
        "name": "View Membership",
        "url": `/api/wallet/pwa/membership/${customerCardId}`,
        "description": "View your gym membership card"
      }
    ],
    "categories": ["fitness", "lifestyle", "health"]
  }
  
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, must-revalidate'
    }
  })
} 