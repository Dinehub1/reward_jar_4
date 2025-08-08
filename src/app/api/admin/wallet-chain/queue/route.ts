/**
 * Wallet Queue Inspector API
 * 
 * Advanced queue management with retry, force, and fail actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { walletGenerationService } from '@/lib/wallet/wallet-generation-service'
import type { ApiResponse } from '@/lib/supabase/types'

interface QueueItem {
  id: string
  card_id: string
  customer_id?: string
  platform: string
  priority: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  processed_at?: string
  error_message?: string
  retry_count: number
  wallet_pass_id?: string
  metadata?: any
}

interface QueueInspectorData {
  queue: {
    pending: QueueItem[]
    processing: QueueItem[]
    completed: QueueItem[]
    failed: QueueItem[]
  }
  statistics: {
    totalItems: number
    successRate: number
    averageProcessingTime: number
    peakHours: Array<{ hour: number; count: number }>
    platformBreakdown: Record<string, number>
    errorFrequency: Array<{ error: string; count: number }>
  }
  health: {
    queueLength: number
    oldestPendingAge: number
    processingCapacity: number
    recommendedActions: string[]
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('📊 QUEUE INSPECTOR: Fetching queue data...')

  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Admin role verification
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Get comprehensive queue data
    const inspectorData = await getQueueInspectorData(adminClient)

    console.log(`✅ QUEUE INSPECTOR: Data fetched in ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      data: inspectorData,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 QUEUE INSPECTOR: Critical error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch queue data',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('⚡ QUEUE INSPECTOR: Processing queue action...')

  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Admin role verification
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { action, itemIds, priority = 'normal' } = body

    if (!action || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action or item IDs'
      } as ApiResponse<never>, { status: 400 })
    }

    // Execute queue action
    const result = await executeQueueAction(action, itemIds, priority, adminClient, user.id)

    console.log(`✅ QUEUE INSPECTOR: Action '${action}' completed in ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 QUEUE INSPECTOR: Action failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Queue action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Get comprehensive queue inspector data
 */
async function getQueueInspectorData(adminClient: any): Promise<QueueInspectorData> {
  // Get queue data from both the service and database
  const serviceQueue = walletGenerationService.getQueueStatus()
  
  // Get extended queue data from database
  const { data: dbQueue, error: dbError } = await adminClient
    .from('wallet_update_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (dbError) {
    console.error('Error fetching database queue:', dbError)
  }

  // Combine and organize queue data
  const queue = organizeQueueData(serviceQueue, dbQueue || [])
  
  // Calculate statistics
  const statistics = calculateQueueStatistics(dbQueue || [])
  
  // Assess queue health
  const health = assessQueueHealth(queue)

  return {
    queue,
    statistics,
    health
  }
}

/**
 * Organize queue data by status
 */
function organizeQueueData(serviceQueue: any, dbQueue: any[]): QueueInspectorData['queue'] {
  // Map service queue data to consistent format
  const pending = serviceQueue.pending.map((item: any) => ({
    id: item.id,
    card_id: item.cardId,
    customer_id: item.customerId,
    platform: item.types.join(','),
    priority: item.priority,
    status: 'pending' as const,
    created_at: item.createdAt,
    updated_at: item.createdAt,
    retry_count: 0,
    metadata: item.metadata
  }))

  const processing = serviceQueue.processing.map((item: any) => ({
    id: item.id,
    card_id: item.cardId,
    customer_id: item.customerId,
    platform: item.types.join(','),
    priority: item.priority,
    status: 'processing' as const,
    created_at: item.createdAt,
    updated_at: item.createdAt,
    retry_count: 0,
    metadata: item.metadata
  }))

  const completed = serviceQueue.completed.map((result: any) => ({
    id: result.requestId,
    card_id: result.unifiedData?.id || 'unknown',
    customer_id: result.unifiedData?.customer?.id,
    platform: Object.keys(result.results).join(','),
    priority: 'normal',
    status: 'completed' as const,
    created_at: result.generatedAt,
    updated_at: result.generatedAt,
    processed_at: result.generatedAt,
    retry_count: 0,
    wallet_pass_id: 'generated'
  }))

  const failed = serviceQueue.failed.map((failure: any) => ({
    id: failure.request.id,
    card_id: failure.request.cardId,
    customer_id: failure.request.customerId,
    platform: failure.request.types.join(','),
    priority: failure.request.priority,
    status: 'failed' as const,
    created_at: failure.request.createdAt,
    updated_at: failure.failedAt,
    error_message: failure.error,
    retry_count: 1
  }))

  // Merge with database queue data for historical context
  const dbCompleted = dbQueue.filter(item => item.processed && !item.failed).map(item => ({
    id: item.id,
    card_id: item.card_id,
    customer_id: item.customer_id,
    platform: item.platform || 'unknown',
    priority: item.priority || 'normal',
    status: 'completed' as const,
    created_at: item.created_at,
    updated_at: item.updated_at,
    processed_at: item.processed_at,
    retry_count: item.retry_count || 0,
    wallet_pass_id: item.wallet_pass_id
  }))

  const dbFailed = dbQueue.filter(item => item.failed).map(item => ({
    id: item.id,
    card_id: item.card_id,
    customer_id: item.customer_id,
    platform: item.platform || 'unknown',
    priority: item.priority || 'normal',
    status: 'failed' as const,
    created_at: item.created_at,
    updated_at: item.updated_at,
    error_message: item.error_message,
    retry_count: item.retry_count || 0
  }))

  return {
    pending,
    processing,
    completed: [...completed, ...dbCompleted].slice(0, 100), // Limit to recent 100
    failed: [...failed, ...dbFailed].slice(0, 50) // Limit to recent 50
  }
}

/**
 * Calculate queue statistics
 */
function calculateQueueStatistics(dbQueue: any[]): QueueInspectorData['statistics'] {
  const totalItems = dbQueue.length
  const completedItems = dbQueue.filter(item => item.processed && !item.failed)
  const failedItems = dbQueue.filter(item => item.failed)
  
  const successRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 100

  // Calculate average processing time
  const processingTimes = completedItems
    .filter(item => item.processed_at && item.created_at)
    .map(item => new Date(item.processed_at).getTime() - new Date(item.created_at).getTime())
  
  const averageProcessingTime = processingTimes.length > 0 
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
    : 0

  // Calculate peak hours (last 7 days)
  const peakHours = calculatePeakHours(dbQueue)
  
  // Platform breakdown
  const platformBreakdown = dbQueue.reduce((acc, item) => {
    const platform = item.platform || 'unknown'
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Error frequency
  const errorFrequency = failedItems
    .reduce((acc, item) => {
      const error = item.error_message || 'Unknown error'
      const existing = acc.find(e => e.error === error)
      if (existing) {
        existing.count++
      } else {
        acc.push({ error, count: 1 })
      }
      return acc
    }, [] as Array<{ error: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalItems,
    successRate: Math.round(successRate * 100) / 100,
    averageProcessingTime: Math.round(averageProcessingTime / 1000), // Convert to seconds
    peakHours,
    platformBreakdown,
    errorFrequency
  }
}

/**
 * Calculate peak usage hours
 */
function calculatePeakHours(dbQueue: any[]): Array<{ hour: number; count: number }> {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentItems = dbQueue.filter(item => new Date(item.created_at) > last7Days)
  
  const hourCounts = recentItems.reduce((acc, item) => {
    const hour = new Date(item.created_at).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts[hour] || 0
  })).sort((a, b) => b.count - a.count)
}

/**
 * Assess queue health and provide recommendations
 */
function assessQueueHealth(queue: QueueInspectorData['queue']): QueueInspectorData['health'] {
  const queueLength = queue.pending.length + queue.processing.length
  
  // Find oldest pending item
  const oldestPending = queue.pending.reduce((oldest, item) => {
    const itemAge = Date.now() - new Date(item.created_at).getTime()
    return itemAge > oldest ? itemAge : oldest
  }, 0)

  const oldestPendingAge = Math.round(oldestPending / 1000) // Convert to seconds
  
  // Assume processing capacity based on current configuration
  const processingCapacity = 3 // Current max concurrent from service

  // Generate recommendations
  const recommendedActions: string[] = []
  
  if (queueLength > 50) {
    recommendedActions.push('Queue is very long - consider increasing processing capacity')
  }
  
  if (oldestPendingAge > 300) { // 5 minutes
    recommendedActions.push('Items are waiting too long - check for processing bottlenecks')
  }
  
  if (queue.failed.length > 10) {
    recommendedActions.push('High failure rate - investigate error patterns')
  }
  
  if (queue.processing.length === 0 && queue.pending.length > 0) {
    recommendedActions.push('Processing appears stalled - restart queue processor')
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Queue is operating normally')
  }

  return {
    queueLength,
    oldestPendingAge,
    processingCapacity,
    recommendedActions
  }
}

/**
 * Execute queue management actions
 */
async function executeQueueAction(action: string, itemIds: string[], priority: string, adminClient: any, userId: string) {
  console.log(`🎯 QUEUE ACTION: Executing '${action}' on ${itemIds.length} items`)

  switch (action) {
    case 'retry':
      return await retryQueueItems(itemIds, priority, adminClient, userId)
    
    case 'force':
      return await forceProcessItems(itemIds, adminClient, userId)
    
    case 'fail':
      return await failQueueItems(itemIds, adminClient, userId)
    
    case 'clear_completed':
      return await clearCompletedItems(adminClient, userId)
    
    case 'clear_failed':
      return await clearFailedItems(adminClient, userId)
    
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

/**
 * Retry failed queue items
 */
async function retryQueueItems(itemIds: string[], priority: string, adminClient: any, userId: string) {
  const { data, error } = await adminClient
    .from('wallet_update_queue')
    .update({
      failed: false,
      processed: false,
      error_message: null,
      retry_count: adminClient.raw('retry_count + 1'),
      priority,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .in('id', itemIds)
    .select()

  if (error) {
    throw error
  }

  return {
    action: 'retry',
    itemsProcessed: data?.length || 0,
    itemIds,
    message: `Retried ${data?.length || 0} queue items with priority ${priority}`
  }
}

/**
 * Force process items (mark as completed)
 */
async function forceProcessItems(itemIds: string[], adminClient: any, userId: string) {
  const { data, error } = await adminClient
    .from('wallet_update_queue')
    .update({
      processed: true,
      failed: false,
      processed_at: new Date().toISOString(),
      wallet_pass_id: 'force-completed',
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .in('id', itemIds)
    .select()

  if (error) {
    throw error
  }

  return {
    action: 'force',
    itemsProcessed: data?.length || 0,
    itemIds,
    message: `Force completed ${data?.length || 0} queue items`
  }
}

/**
 * Mark items as permanently failed
 */
async function failQueueItems(itemIds: string[], adminClient: any, userId: string) {
  const { data, error } = await adminClient
    .from('wallet_update_queue')
    .update({
      failed: true,
      processed: false,
      error_message: 'Manually marked as failed by admin',
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .in('id', itemIds)
    .select()

  if (error) {
    throw error
  }

  return {
    action: 'fail',
    itemsProcessed: data?.length || 0,
    itemIds,
    message: `Marked ${data?.length || 0} queue items as failed`
  }
}

/**
 * Clear completed items from queue
 */
async function clearCompletedItems(adminClient: any, userId: string) {
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  
  const { data, error } = await adminClient
    .from('wallet_update_queue')
    .delete()
    .eq('processed', true)
    .eq('failed', false)
    .lt('processed_at', cutoffDate.toISOString())

  if (error) {
    throw error
  }

  return {
    action: 'clear_completed',
    itemsProcessed: data?.length || 0,
    message: `Cleared completed items older than 7 days`
  }
}

/**
 * Clear failed items from queue
 */
async function clearFailedItems(adminClient: any, userId: string) {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  
  const { data, error } = await adminClient
    .from('wallet_update_queue')
    .delete()
    .eq('failed', true)
    .lt('updated_at', cutoffDate.toISOString())

  if (error) {
    throw error
  }

  return {
    action: 'clear_failed',
    itemsProcessed: data?.length || 0,
    message: `Cleared failed items older than 30 days`
  }
}