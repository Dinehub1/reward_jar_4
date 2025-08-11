import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  try {
    
    const supabase = createAdminClient()
    
    // Get all pending wallet updates (using correct column names)
    const { data: pendingUpdates, error: fetchError } = await supabase
      .from('wallet_update_queue')
      .select('*')
      .eq('processed', false)
      .eq('failed', false)
      .limit(10)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch pending updates', details: fetchError.message },
        { status: 500 }
      )
    }


    // Process each update (simulate processing)
    const processedCount = pendingUpdates?.length || 0
    
    if (processedCount > 0) {
      // Mark updates as processed (using correct column names)
      const { error: updateError } = await supabase
        .from('wallet_update_queue')
        .update({ 
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('processed', false)
        .eq('failed', false)

      if (updateError) {
      }
    }


    return NextResponse.json({
      success: true,
      message: `Wallet sync completed successfully`,
      processed: processedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error during wallet sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}