import { NextRequest, NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/env'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
    const { customerCardId } = await params
  const base = getBaseUrl()
  return NextResponse.redirect(`${base}/api/wallet/pwa/${customerCardId}`, 302)
} 