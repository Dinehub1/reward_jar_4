import { NextRequest, NextResponse } from 'next/server'
import { buildPwaManifest, DEFAULT_PWA_ICONS } from '@/lib/wallet/pwa-manifest'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  const { customerCardId } = await params
  
  const manifest = {
    ...buildPwaManifest({
      name: 'Gym Membership - RewardJar',
      shortName: 'Membership',
      themeColor: '#10b981',
      backgroundColor: '#10b981',
      scope: `/api/wallet/pwa/membership/${customerCardId}/`,
      startUrl: `/api/wallet/pwa/membership/${customerCardId}`,
      icons: DEFAULT_PWA_ICONS,
    }),
    shortcuts: [
      {
        name: 'View Membership',
        url: `/api/wallet/pwa/membership/${customerCardId}`,
        description: 'View your gym membership card'
      }
    ],
    categories: ['fitness', 'lifestyle', 'health']
  }
  
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, must-revalidate'
    }
  })
} 