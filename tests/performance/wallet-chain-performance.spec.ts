/**
 * Wallet Chain Performance Tests
 * 
 * Tests performance characteristics of the wallet generation pipeline
 */

import { test, expect } from '@playwright/test'
import { walletGenerationService } from '../../src/lib/wallet/wallet-generation-service'
import { walletVerificationService } from '../../src/lib/wallet/wallet-verification'
import { createAdminClient } from '../../src/lib/supabase/admin-client'

test.describe('Wallet Chain Performance', () => {
  let testCardId: string
  let testCustomerId: string

  test.beforeAll(async () => {
    // Create minimal test data for performance testing
    const supabase = createAdminClient()
    
    const { data: business } = await supabase.from('businesses').insert({
      name: 'Perf Test Business',
      contact_email: 'perf@test.com'
    }).select().single()
    
    const { data: customer } = await supabase.from('customers').insert({
      email: 'perfcustomer@test.com',
      name: 'Performance Customer'
    }).select().single()
    
    const { data: card } = await supabase.from('stamp_cards').insert({
      name: 'Performance Test Card',
      business_id: business!.id,
      total_stamps: 10,
      reward_description: 'Performance test reward',
      status: 'active'
    }).select().single()
    
    await supabase.from('customer_cards').insert({
      customer_id: customer!.id,
      stamp_card_id: card!.id,
      current_stamps: 5
    })
    
    testCardId = card!.id
    testCustomerId = customer!.id
  })

  test('single wallet generation should complete within 5 seconds', async () => {
    const startTime = Date.now()
    
    const requestId = await walletGenerationService.enqueueGeneration({
      cardId: testCardId,
      customerId: testCustomerId,
      types: ['pwa'], // Fastest generation type
      priority: 'high'
    })
    
    // Wait for completion
    let result = null
    while (!result && (Date.now() - startTime) < 10000) {
      result = walletGenerationService.getResult(requestId)
      if (!result) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const totalTime = Date.now() - startTime
    
    expect(result).toBeTruthy()
    expect(result!.success).toBe(true)
    expect(totalTime).toBeLessThan(5000) // Should complete in under 5 seconds
    
    console.log(`Single wallet generation completed in ${totalTime}ms`)
  })

  test('batch wallet generation should scale linearly', async () => {
    const batchSizes = [1, 5, 10]
    const results: { size: number; time: number; avgTime: number }[] = []
    
    for (const batchSize of batchSizes) {
      const startTime = Date.now()
      const requestIds: string[] = []
      
      // Submit batch
      for (let i = 0; i < batchSize; i++) {
        const requestId = await walletGenerationService.enqueueGeneration({
          cardId: testCardId,
          customerId: testCustomerId,
          types: ['pwa'],
          priority: 'normal'
        })
        requestIds.push(requestId)
      }
      
      // Wait for all to complete
      let completed = 0
      while (completed < batchSize && (Date.now() - startTime) < 30000) {
        completed = requestIds.filter(id => walletGenerationService.getResult(id)).length
        if (completed < batchSize) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      const totalTime = Date.now() - startTime
      const avgTime = totalTime / batchSize
      
      results.push({ size: batchSize, time: totalTime, avgTime })
      
      console.log(`Batch size ${batchSize}: ${totalTime}ms total, ${avgTime}ms average`)
      
      // Verify all completed successfully
      expect(completed).toBe(batchSize)
    }
    
    // Verify scaling characteristics
    // Average time per item should not increase dramatically with batch size
    const maxAvgTime = Math.max(...results.map(r => r.avgTime))
    const minAvgTime = Math.min(...results.map(r => r.avgTime))
    const scalingRatio = maxAvgTime / minAvgTime
    
    expect(scalingRatio).toBeLessThan(3) // Should scale reasonably well
  })

  test('verification should complete within 2 seconds', async () => {
    const startTime = Date.now()
    
    const verification = await walletVerificationService.verifyWalletChain(
      testCardId,
      testCustomerId
    )
    
    const totalTime = Date.now() - startTime
    
    expect(verification.status).toBe('completed')
    expect(totalTime).toBeLessThan(2000) // Should complete in under 2 seconds
    
    console.log(`Wallet verification completed in ${totalTime}ms`)
    console.log(`Tests passed: ${verification.summary.passed}/${verification.summary.total}`)
  })

  test('concurrent generation should not degrade performance significantly', async () => {
    const concurrentRequests = 5
    const startTime = Date.now()
    
    // Submit all requests simultaneously
    const requestPromises = Array(concurrentRequests).fill(null).map(() =>
      walletGenerationService.enqueueGeneration({
        cardId: testCardId,
        customerId: testCustomerId,
        types: ['pwa'],
        priority: 'normal'
      })
    )
    
    const requestIds = await Promise.all(requestPromises)
    
    // Wait for all to complete
    let completed = 0
    while (completed < concurrentRequests && (Date.now() - startTime) < 15000) {
      completed = requestIds.filter(id => walletGenerationService.getResult(id)).length
      if (completed < concurrentRequests) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const totalTime = Date.now() - startTime
    const avgTime = totalTime / concurrentRequests
    
    expect(completed).toBe(concurrentRequests)
    expect(avgTime).toBeLessThan(3000) // Should average under 3 seconds per request
    
    console.log(`${concurrentRequests} concurrent requests: ${totalTime}ms total, ${avgTime}ms average`)
  })

  test('memory usage should remain stable during batch processing', async () => {
    const initialMemory = process.memoryUsage()
    
    // Generate multiple batches to test memory stability
    for (let batch = 0; batch < 3; batch++) {
      const requestIds: string[] = []
      
      // Submit batch
      for (let i = 0; i < 5; i++) {
        const requestId = await walletGenerationService.enqueueGeneration({
          cardId: testCardId,
          customerId: testCustomerId,
          types: ['pwa'],
          priority: 'normal'
        })
        requestIds.push(requestId)
      }
      
      // Wait for completion
      let completed = 0
      while (completed < 5) {
        completed = requestIds.filter(id => walletGenerationService.getResult(id)).length
        if (completed < 5) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
    }
    
    const finalMemory = process.memoryUsage()
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
    const memoryIncreaseRatio = memoryIncrease / initialMemory.heapUsed
    
    console.log(`Memory usage: ${initialMemory.heapUsed} → ${finalMemory.heapUsed} (${memoryIncreaseRatio.toFixed(2)}x)`)
    
    // Memory should not increase by more than 50%
    expect(memoryIncreaseRatio).toBeLessThan(0.5)
  })

  test('queue processing should handle high load gracefully', async () => {
    const highLoadRequests = 20
    const startTime = Date.now()
    
    // Submit high load
    const requestIds: string[] = []
    for (let i = 0; i < highLoadRequests; i++) {
      const requestId = await walletGenerationService.enqueueGeneration({
        cardId: testCardId,
        customerId: testCustomerId,
        types: ['pwa'],
        priority: i < 5 ? 'high' : 'normal' // Mix priorities
      })
      requestIds.push(requestId)
    }
    
    // Monitor queue status during processing
    const queueStatuses: any[] = []
    let completed = 0
    
    while (completed < highLoadRequests && (Date.now() - startTime) < 60000) {
      const queueStatus = walletGenerationService.getQueueStatus()
      queueStatuses.push({
        time: Date.now() - startTime,
        pending: queueStatus.pending.length,
        processing: queueStatus.processing.length,
        completed: queueStatus.completed.length
      })
      
      completed = requestIds.filter(id => walletGenerationService.getResult(id)).length
      
      if (completed < highLoadRequests) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    const totalTime = Date.now() - startTime
    
    expect(completed).toBe(highLoadRequests)
    expect(totalTime).toBeLessThan(60000) // Should complete within 1 minute
    
    // Verify queue was managed properly (max 3 concurrent as configured)
    const maxProcessing = Math.max(...queueStatuses.map(s => s.processing))
    expect(maxProcessing).toBeLessThanOrEqual(3)
    
    console.log(`High load test: ${highLoadRequests} requests in ${totalTime}ms`)
    console.log(`Max concurrent processing: ${maxProcessing}`)
  })

  test.afterAll(async () => {
    // Clean up test data
    const supabase = createAdminClient()
    
    await supabase.from('customer_cards').delete().eq('customer_id', testCustomerId)
    await supabase.from('stamp_cards').delete().eq('id', testCardId)
    await supabase.from('customers').delete().eq('id', testCustomerId)
    
    // Clear queue history
    walletGenerationService.clearHistory()
  })
})