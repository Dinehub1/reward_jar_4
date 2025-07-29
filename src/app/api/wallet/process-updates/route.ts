/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-only'

// Wallet Update Queue Processor
// This endpoint processes pending wallet updates from the queue
// Triggered by database changes via triggers

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get pending wallet updates from the queue
    const { data: pendingUpdates, error: queueError } = await supabase
      .from('wallet_update_queue')
      .select('*')
      .eq('processed', false)
      .eq('failed', false)
      .order('created_at', { ascending: true })
      .limit(50) // Process in batches

    if (queueError) {
      console.error('Error fetching wallet update queue:', queueError)
      return NextResponse.json(
        { error: 'Failed to fetch update queue' },
        { status: 500 }
      )
    }

    if (!pendingUpdates || pendingUpdates.length === 0) {
      return NextResponse.json({
        message: 'No pending wallet updates',
        processed: 0
      })
    }

    console.log(`Processing ${pendingUpdates.length} wallet updates...`)

    let processedCount = 0
    let failedCount = 0

    // Process each update
    for (const update of pendingUpdates) {
      try {
        // Get customer card data with all related information
        const { data: customerCard, error: cardError } = await supabase
          .from('customer_cards')
          .select(`
            id,
            current_stamps,
            wallet_type,
            wallet_pass_id,
            created_at,
            updated_at,
            stamp_cards (
              id,
              name,
              total_stamps,
              reward_description,
              updated_at,
              businesses (
                name,
                description,
                updated_at
              )
            ),
            customers (
              name,
              email,
              updated_at
            )
          `)
          .eq('id', update.customer_card_id)
          .single()

        if (cardError || !customerCard) {
          console.error(`Customer card not found for update ${update.id}:`, cardError)
          await markUpdateAsFailed(supabase, update.id, 'Customer card not found')
          failedCount++
          continue
        }

        // Process different wallet types
        const results = await Promise.allSettled([
          processAppleWalletUpdate(customerCard, update),
          processGoogleWalletUpdate(customerCard, update),
          processPWAWalletUpdate(customerCard, update)
        ])

        // Check if any updates succeeded
        const hasSuccess = results.some(result => result.status === 'fulfilled')
        
        if (hasSuccess) {
          // Mark update as processed
          await supabase
            .from('wallet_update_queue')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id)

          processedCount++
          console.log(`Successfully processed wallet update ${update.id}`)
        } else {
          // All wallet updates failed
          const errors = results
            .filter(result => result.status === 'rejected')
            .map(result => (result as PromiseRejectedResult).reason)
            .join('; ')

          await markUpdateAsFailed(supabase, update.id, `All wallet updates failed: ${errors}`)
          failedCount++
        }

      } catch (error) {
        console.error(`Error processing wallet update ${update.id}:`, error)
        await markUpdateAsFailed(supabase, update.id, error instanceof Error ? error.message : 'Unknown error')
        failedCount++
      }
    }

    return NextResponse.json({
      message: 'Wallet update processing completed',
      processed: processedCount,
      failed: failedCount,
      total: pendingUpdates.length
    })

  } catch (error) {
    console.error('Error in wallet update processor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to mark an update as failed
async function markUpdateAsFailed(supabase: any, updateId: string, errorMessage: string) {
  await supabase
    .from('wallet_update_queue')
    .update({
      failed: true,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', updateId)
}

// Process Apple Wallet updates
async function processAppleWalletUpdate(customerCard: any, update: any): Promise<void> {
  // Only process if customer has Apple Wallet
  if (customerCard.wallet_type !== 'apple') {
    return
  }

  // Check if Apple Wallet is configured
  if (!process.env.APPLE_CERT_BASE64 || !process.env.APPLE_KEY_BASE64) {
    console.log('Apple Wallet not configured, skipping update')
    return
  }

  // In a full implementation, this would:
  // 1. Generate updated PKPass file
  // 2. Send push notification to Apple's servers
  // 3. Update the pass in Apple Wallet
  
  console.log(`Apple Wallet update for card ${customerCard.id}: ${update.update_type}`)
  
  // For now, just log the update
  // TODO: Implement actual Apple Wallet push notification
}

// Process Google Wallet updates
async function processGoogleWalletUpdate(customerCard: any, update: any): Promise<void> {
  // Only process if customer has Google Wallet
  if (customerCard.wallet_type !== 'google') {
    return
  }

  // Check if Google Wallet is configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.log('Google Wallet not configured, skipping update')
    return
  }

  // In a full implementation, this would:
  // 1. Update the loyalty object in Google Wallet
  // 2. Send update notification to Google's servers
  
  console.log(`Google Wallet update for card ${customerCard.id}: ${update.update_type}`)
  
  // For now, just log the update
  // TODO: Implement actual Google Wallet object update
}

// Process PWA Wallet updates
async function processPWAWalletUpdate(customerCard: any, update: any): Promise<void> {
  // PWA updates are handled client-side through service worker
  // This could trigger web push notifications
  
  console.log(`PWA Wallet update for card ${customerCard.id}: ${update.update_type}`)
  
  // TODO: Implement web push notifications for PWA wallets
}

// GET endpoint to check queue status
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get queue statistics
    const { data: queueStats, error } = await supabase
      .from('wallet_update_queue')
      .select('processed, failed, update_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching queue stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch queue stats' },
        { status: 500 }
      )
    }

    const stats = {
      total: queueStats?.length || 0,
      pending: queueStats?.filter(item => !item.processed && !item.failed).length || 0,
      processed: queueStats?.filter(item => item.processed).length || 0,
      failed: queueStats?.filter(item => item.failed).length || 0,
      byType: {
        stamp_update: queueStats?.filter(item => item.update_type === 'stamp_update').length || 0,
        reward_complete: queueStats?.filter(item => item.update_type === 'reward_complete').length || 0,
        card_update: queueStats?.filter(item => item.update_type === 'card_update').length || 0
      }
    }

    return NextResponse.json({
      message: 'Wallet update queue status',
      stats,
      recentUpdates: queueStats?.slice(0, 10) || []
    })

  } catch (error) {
    console.error('Error fetching wallet update queue status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 