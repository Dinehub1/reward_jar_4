import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/test/simple
 * 
 * Basic API functionality test - returns a simple success response
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'API is working correctly',
        timestamp,
        method: 'GET',
        path: '/api/test/simple',
        status: 'operational'
      },
      timestamp
    })
  } catch (error) {
    console.error('Simple API test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Simple API test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/test/simple
 * 
 * Basic POST functionality test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'POST request processed successfully',
        timestamp,
        method: 'POST',
        path: '/api/test/simple',
        receivedBody: body,
        status: 'operational'
      },
      timestamp
    })
  } catch (error) {
    console.error('Simple POST API test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Simple POST API test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}