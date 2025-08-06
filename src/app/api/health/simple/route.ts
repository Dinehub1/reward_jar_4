import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple health check endpoint for development tools testing
 * Returns basic system status without authentication requirements
 */
export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '4.0.0'
    }

    return NextResponse.json({
      success: true,
      data: health,
      message: 'System is healthy'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function HEAD(request: NextRequest) {
  // For health check tools that only need HTTP status
  return new NextResponse(null, { status: 200 })
}