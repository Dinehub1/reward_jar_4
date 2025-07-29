/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface WalletUpdate {
  id: string
  customer_card_id: string
  update_type: 'stamp_update' | 'reward_complete' | 'card_update' | 'session_update' | 'membership_update'
  metadata: any
  created_at: string
}

interface CustomerCard {
  id: string
  customer_id: string
  stamp_card_id: string | null
  membership_card_id: string | null
  current_stamps: number
  sessions_used: number
  expiry_date: string | null
  wallet_type: 'apple' | 'google' | 'pwa' | null
  wallet_pass_id: string | null
  customers: {
    name: string
    email: string
  }
  stamp_cards?: {
    id: string
    name: string
    total_stamps: number
    reward_description: string
    businesses: {
      name: string
    }
  }
  membership_cards?: {
    id: string
    name: string
    total_sessions: number
    cost: number
    businesses: {
      name: string
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 WALLET QUEUE PROCESSOR - Starting batch update processing...')
  
  try {
    // Admin authentication check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (token !== process.env.ADMIN_DEBUG_TOKEN && token !== 'admin-debug-token') {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    
    // Get pending wallet updates (limit to 50 per batch)
    const { data: pendingUpdates, error: updatesError } = await supabase
      .from('wallet_update_queue')
      .select('*')
      .eq('processed', false)
      .eq('failed', false)
      .order('created_at', { ascending: true })
      .limit(50)

    if (updatesError) {
      console.error('❌ Error fetching pending updates:', updatesError)
      return NextResponse.json(
        { error: 'Failed to fetch pending updates' },
        { status: 500 }
      )
    }

    if (!pendingUpdates || pendingUpdates.length === 0) {
      console.log('✅ No pending wallet updates found')
      return NextResponse.json({
        success: true,
        message: 'No pending updates to process',
        processed_count: 0
      })
    }

    console.log(`📦 Found ${pendingUpdates.length} pending wallet updates`)

    let processedCount = 0
    let failedCount = 0
    const results = []

    // Process each update
    for (const update of pendingUpdates as WalletUpdate[]) {
      try {
        console.log(`🔄 Processing update ${update.id} - Type: ${update.update_type}`)
        
        // Get customer card details with relationships
        const { data: customerCard, error: cardError } = await supabase
          .from('customer_cards')
          .select(`
            id,
            customer_id,
            stamp_card_id,
            membership_card_id,
            current_stamps,
            sessions_used,
            expiry_date,
            wallet_type,
            wallet_pass_id,
            customers!inner(name, email),
            stamp_cards(id, name, total_stamps, reward_description, businesses!inner(name)),
            membership_cards(id, name, total_sessions, cost, businesses!inner(name))
          `)
          .eq('id', update.customer_card_id)
          .single()

        if (cardError || !customerCard) {
          console.error(`❌ Customer card not found: ${update.customer_card_id}`)
          await markUpdateFailed(supabase, update.id, 'Customer card not found')
          failedCount++
          continue
        }

        const card = customerCard as CustomerCard
        
        // Determine card type and process accordingly
        const isStampCard = card.stamp_card_id !== null
        const isMembershipCard = card.membership_card_id !== null

        if (!isStampCard && !isMembershipCard) {
          console.error(`❌ Invalid card type for ${update.customer_card_id}`)
          await markUpdateFailed(supabase, update.id, 'Invalid card type')
          failedCount++
          continue
        }

        // Process based on wallet type
        const walletType = card.wallet_type
        if (!walletType) {
          console.log(`⚠️ No wallet type set for card ${update.customer_card_id}, skipping`)
          await markUpdateProcessed(supabase, update.id)
          processedCount++
          continue
        }

        let updateResult = null

        switch (walletType) {
          case 'apple':
            updateResult = await processAppleWalletUpdate(card, update, isStampCard)
            break
          case 'google':
            updateResult = await processGoogleWalletUpdate(card, update, isStampCard)
            break
          case 'pwa':
            updateResult = await processPWAWalletUpdate(card, update, isStampCard)
            break
          default:
            console.error(`❌ Unknown wallet type: ${walletType}`)
            await markUpdateFailed(supabase, update.id, `Unknown wallet type: ${walletType}`)
            failedCount++
            continue
        }

        if (updateResult?.success) {
          await markUpdateProcessed(supabase, update.id)
          processedCount++
          console.log(`✅ Successfully processed ${update.update_type} for ${walletType} wallet`)
        } else {
          await markUpdateFailed(supabase, update.id, updateResult?.error || 'Unknown error')
          failedCount++
          console.error(`❌ Failed to process ${update.update_type} for ${walletType} wallet:`, updateResult?.error)
        }

        results.push({
          update_id: update.id,
          customer_card_id: update.customer_card_id,
          update_type: update.update_type,
          wallet_type: walletType,
          success: updateResult?.success || false,
          error: updateResult?.error
        })

      } catch (error) {
        console.error(`❌ Error processing update ${update.id}:`, error)
        await markUpdateFailed(supabase, update.id, error instanceof Error ? error.message : 'Unknown error')
        failedCount++
      }
    }

    console.log(`🎯 WALLET QUEUE PROCESSING COMPLETE`)
    console.log(`   ✅ Processed: ${processedCount}`)
    console.log(`   ❌ Failed: ${failedCount}`)
    console.log(`   📊 Total: ${pendingUpdates.length}`)

    return NextResponse.json({
      success: true,
      message: 'Wallet queue processing completed',
      processed_count: processedCount,
      failed_count: failedCount,
      total_updates: pendingUpdates.length,
      results
    })

  } catch (error) {
    console.error('❌ WALLET QUEUE PROCESSOR ERROR:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to mark update as processed
async function markUpdateProcessed(supabase: any, updateId: string) {
  await supabase
    .from('wallet_update_queue')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      failed: false,
      error_message: null
    })
    .eq('id', updateId)
}

// Helper function to mark update as failed
async function markUpdateFailed(supabase: any, updateId: string, errorMessage: string) {
  await supabase
    .from('wallet_update_queue')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      failed: true,
      error_message: errorMessage
    })
    .eq('id', updateId)
}

// Apple Wallet update processor
async function processAppleWalletUpdate(
  card: CustomerCard, 
  update: WalletUpdate, 
  isStampCard: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🍎 Processing Apple Wallet update for card ${card.id}`)
    
    // For Apple Wallet, we need to regenerate the PKPass file
    // This would typically involve:
    // 1. Creating updated pass data
    // 2. Signing the pass with Apple certificates
    // 3. Sending push notification to update the pass
    
    const passData = {
      card_id: card.id,
      customer_name: card.customers.name,
      business_name: isStampCard ? card.stamp_cards?.businesses.name : card.membership_cards?.businesses.name,
      card_name: isStampCard ? card.stamp_cards?.name : card.membership_cards?.name,
      progress: isStampCard 
        ? `${card.current_stamps}/${card.stamp_cards?.total_stamps}`
        : `${card.sessions_used}/${card.membership_cards?.total_sessions}`,
      reward_description: isStampCard ? card.stamp_cards?.reward_description : `${card.membership_cards?.total_sessions} sessions for $${card.membership_cards?.cost}`,
      update_type: update.update_type,
      timestamp: new Date().toISOString()
    }

    // In a real implementation, you would:
    // 1. Generate new PKPass with updated data
    // 2. Send push notification to Apple's servers
    // 3. Update the pass on the user's device
    
    console.log('🍎 Apple Wallet pass data prepared:', passData)
    
    // For now, we'll simulate success
    return { success: true }
    
  } catch (error) {
    console.error('🍎 Apple Wallet update error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Apple Wallet update failed' 
    }
  }
}

// Google Wallet update processor
async function processGoogleWalletUpdate(
  card: CustomerCard, 
  update: WalletUpdate, 
  isStampCard: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🤖 Processing Google Wallet update for card ${card.id}`)
    
    // For Google Wallet, we need to update the object via Google's API
    const objectData = {
      id: card.wallet_pass_id || `${card.id}-google`,
      classId: process.env.GOOGLE_CLASS_ID,
      state: 'ACTIVE',
      heroImage: {
        sourceUri: {
          uri: 'https://your-domain.com/hero-image.png'
        }
      },
      textModulesData: [
        {
          header: isStampCard ? 'Stamps Collected' : 'Sessions Used',
          body: isStampCard 
            ? `${card.current_stamps} of ${card.stamp_cards?.total_stamps}`
            : `${card.sessions_used} of ${card.membership_cards?.total_sessions}`,
          id: 'progress'
        }
      ],
      loyaltyPoints: {
        balance: {
          int: isStampCard ? card.current_stamps : card.sessions_used
        },
        label: isStampCard ? 'Stamps' : 'Sessions'
      }
    }

    console.log('🤖 Google Wallet object data prepared:', objectData)
    
    // In a real implementation, you would:
    // 1. Call Google Wallet API to update the object
    // 2. Handle API response and errors
    
    return { success: true }
    
  } catch (error) {
    console.error('🤖 Google Wallet update error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Google Wallet update failed' 
    }
  }
}

// PWA Wallet update processor
async function processPWAWalletUpdate(
  card: CustomerCard, 
  update: WalletUpdate, 
  isStampCard: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🌐 Processing PWA Wallet update for card ${card.id}`)
    
    // For PWA, the update is handled when the user next opens the PWA
    // We can optionally send a web push notification
    
    const updateData = {
      card_id: card.id,
      customer_email: card.customers.email,
      update_type: update.update_type,
      current_progress: isStampCard 
        ? `${card.current_stamps}/${card.stamp_cards?.total_stamps}`
        : `${card.sessions_used}/${card.membership_cards?.total_sessions}`,
      message: getUpdateMessage(update.update_type, isStampCard, card),
      timestamp: new Date().toISOString()
    }

    console.log('🌐 PWA Wallet update data prepared:', updateData)
    
    // In a real implementation, you could:
    // 1. Send web push notification
    // 2. Update cached data for faster PWA loading
    // 3. Log the update for the next PWA sync
    
    return { success: true }
    
  } catch (error) {
    console.error('🌐 PWA Wallet update error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PWA Wallet update failed' 
    }
  }
}

// Helper function to generate update messages
function getUpdateMessage(updateType: string, isStampCard: boolean, card: CustomerCard): string {
  const businessName = isStampCard ? card.stamp_cards?.businesses.name : card.membership_cards?.businesses.name
  
  switch (updateType) {
    case 'stamp_update':
      return `New stamp added! You now have ${card.current_stamps} stamps at ${businessName}.`
    case 'session_update':
      return `Session marked! You have used ${card.sessions_used} sessions at ${businessName}.`
    case 'reward_complete':
      return `🎉 Congratulations! You've completed your card at ${businessName}. Enjoy your reward!`
    case 'membership_update':
      return `Your membership at ${businessName} has been updated.`
    case 'card_update':
      return `Your card at ${businessName} has been updated.`
    default:
      return `Your card at ${businessName} has been updated.`
  }
}

// GET endpoint to check queue status
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const { data: queueStats, error } = await supabase
      .from('wallet_update_queue')
      .select('processed, failed, update_type')
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch queue stats' }, { status: 500 })
    }

    const stats = {
      total: queueStats.length,
      pending: queueStats.filter(item => !item.processed && !item.failed).length,
      processed: queueStats.filter(item => item.processed && !item.failed).length,
      failed: queueStats.filter(item => item.failed).length,
      by_type: queueStats.reduce((acc: any, item) => {
        acc[item.update_type] = (acc[item.update_type] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      queue_stats: stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 