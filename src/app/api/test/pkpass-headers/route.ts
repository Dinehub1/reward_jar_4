import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(_request: NextRequest) {
  try {
    // Try to read the production PKPass file
    const pkpassPath = join(process.cwd(), 'dist', 'production.pkpass')
    
    let pkpassBuffer: Buffer
    try {
      pkpassBuffer = readFileSync(pkpassPath)
    } catch (_error) {
      return NextResponse.json(
        { error: 'Production PKPass file not found. Run generate-production-pkpass.sh first.' },
        { status: 404 }
      )
    }

    // Return with correct headers for Apple Wallet
    return new NextResponse(pkpassBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="production_loyalty_card.pkpass"',
        'Content-Length': pkpassBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-PKPass-Source': 'Apple-Signed-Certificate',
        'X-PKPass-Size': `${pkpassBuffer.length} bytes`
      }
    })
  } catch (error) {
    console.error('Error serving production PKPass:', error)
    return NextResponse.json(
      { error: 'Failed to serve production PKPass file' },
      { status: 500 }
    )
  }
} 