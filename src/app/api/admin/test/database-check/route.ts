import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server-only'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase database connectivity...')
    
    // Use service role client to bypass RLS for testing
    const supabase = createServiceClient()
    
    // Comprehensive database check
    const [businessResult, userResult, stampCardResult, customerCardResult] = await Promise.all([
      supabase.from('businesses').select('id, name').limit(3),
      supabase.from('users').select('count'),
      supabase.from('stamp_cards').select('count'),
      supabase.from('customer_cards').select('membership_type, count')
    ])
    
    if (businessResult.error) {
      console.error('❌ Business query error:', businessResult.error)
      return NextResponse.json({
        status: 'error',
        message: 'Business table query failed',
        error: businessResult.error.message,
        code: businessResult.error.code
      }, { status: 500 })
    }
    
    console.log('✅ Database queries successful')
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connectivity verified',
      data: {
        businesses: businessResult.data,
        statistics: {
          users: userResult.data?.[0]?.count || 0,
          stamp_cards: stampCardResult.data?.[0]?.count || 0,
          customer_cards: customerCardResult.data?.length || 0
        }
      },
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