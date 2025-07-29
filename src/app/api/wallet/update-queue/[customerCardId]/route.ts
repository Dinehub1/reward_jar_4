import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server-only'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const testToken = process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'
    
    if (!authHeader?.includes(testToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const customerCardId = resolvedParams.customerCardId
    const body = await request.json()
    
    const { platform = 'all', updateType = 'stamp_update', testMode = false } = body

    console.log('📝 Queuing wallet update:', {
      customerCardId,
      platform,
      updateType,
      testMode
    })

    const supabase = createServiceClient()

    // Verify customer card exists
    const { data: customerCard, error: cardError } = await supabase
      .from('customer_cards')
      .select('id, stamp_card_id, membership_card_id')
      .eq('id', customerCardId)
      .single()

    if (cardError || !customerCard) {
      console.error('Customer card not found:', cardError)
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    // Determine platforms to queue based on request
    const platforms = platform === 'all' ? ['apple', 'google', 'pwa'] : [platform]
    const queuedUpdates = []

    for (const targetPlatform of platforms) {
      try {
        const { data: queueEntry, error: queueError } = await supabase
          .from('wallet_update_queue')
          .insert({
            customer_card_id: customerCardId,
            platform: targetPlatform,
            update_type: updateType,
            status: 'pending',
            metadata: {
              testMode,
              queuedAt: new Date().toISOString(),
              cardType: customerCard.stamp_card_id ? 'stamp' : 'membership',
              source: 'qr_scan_simulation'
            }
          })
          .select()
          .single()

        if (queueError) {
          console.error(`Error queuing ${targetPlatform} update:`, queueError)
        } else {
          queuedUpdates.push({
            platform: targetPlatform,
            id: queueEntry.id,
            status: 'queued'
          })
          console.log(`✅ ${targetPlatform} wallet update queued:`, queueEntry.id)
        }
      } catch (platformError) {
        console.error(`Error processing ${targetPlatform}:`, platformError)
      }
    }

    if (queuedUpdates.length === 0) {
      return NextResponse.json(
        { error: 'Failed to queue any wallet updates' },
        { status: 500 }
      )
    }

    // Optionally trigger immediate processing for test mode
    if (testMode) {
      try {
        console.log('🔄 Triggering immediate wallet sync for test mode...')
        const processResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wallet/process-updates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ testMode: true })
        })
        
        if (processResponse.ok) {
          console.log('✅ Immediate wallet sync triggered')
        }
      } catch (processError) {
        console.warn('⚠️ Failed to trigger immediate sync:', processError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Wallet updates queued for ${queuedUpdates.length} platform(s)`,
        queuedUpdates,
        customerCardId,
        updateType,
        testMode
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, max-age=1'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error queuing wallet updates:', error)
    return NextResponse.json(
      { error: 'Failed to queue wallet updates' },
      { status: 500 }
    )
  }
} 