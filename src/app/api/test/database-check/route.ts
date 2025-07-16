import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase database connectivity...')
    
    const supabase = await createClient()
    
    // Simple test query to check connectivity
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('❌ Database query error:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Database query failed',
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 })
    }
    
    console.log('✅ Database query successful:', data)
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connectivity verified',
      data: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 