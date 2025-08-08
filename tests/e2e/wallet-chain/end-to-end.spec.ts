/**
 * End-to-End Wallet Chain Tests
 * 
 * Complete testing of card creation → wallet generation → delivery pipeline
 */

import { test, expect, Page } from '@playwright/test'
import { createAdminClient } from '../../../src/lib/supabase/admin-client'
import { walletGenerationService } from '../../../src/lib/wallet/wallet-generation-service'
import { walletVerificationService } from '../../../src/lib/wallet/wallet-verification'

interface TestCard {
  id: string
  type: 'stamp' | 'membership'
  businessId: string
  customerId?: string
}

interface WalletTestContext {
  testCards: TestCard[]
  testBusiness: any
  testCustomer: any
  requestIds: string[]
}

test.describe('Complete Wallet Chain Integration', () => {
  let context: WalletTestContext

  test.beforeAll(async () => {
    // Set up test data
    const supabase = createAdminClient()
    
    // Create test business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: 'E2E Test Business',
        contact_email: 'test@e2etest.com',
        description: 'Test business for wallet chain testing'
      })
      .select()
      .single()
    
    if (businessError) {
      throw new Error(`Failed to create test business: ${businessError.message}`)
    }

    // Create test customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email: 'customer@e2etest.com',
        name: 'E2E Test Customer'
      })
      .select()
      .single()
    
    if (customerError) {
      throw new Error(`Failed to create test customer: ${customerError.message}`)
    }

    // Create test stamp card
    const { data: stampCard, error: stampError } = await supabase
      .from('stamp_cards')
      .insert({
        name: 'E2E Test Stamp Card',
        business_id: business.id,
        total_stamps: 10,
        reward_description: 'Free coffee after 10 stamps',
        status: 'active'
      })
      .select()
      .single()

    if (stampError) {
      throw new Error(`Failed to create test stamp card: ${stampError.message}`)
    }

    // Create test membership card
    const { data: memberCard, error: memberError } = await supabase
      .from('membership_cards')
      .insert({
        name: 'E2E Test Membership',
        business_id: business.id,
        total_sessions: 20,
        cost: 99.99,
        duration_days: 30,
        membership_type: 'premium',
        status: 'active'
      })
      .select()
      .single()

    if (memberError) {
      throw new Error(`Failed to create test membership card: ${memberError.message}`)
    }

    // Create customer card relationships
    await supabase.from('customer_cards').insert([
      {
        customer_id: customer.id,
        stamp_card_id: stampCard.id,
        current_stamps: 5
      },
      {
        customer_id: customer.id,
        membership_card_id: memberCard.id,
        sessions_used: 3,
        total_sessions: 20,
        cost: 99.99,
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ])

    context = {
      testCards: [
        { id: stampCard.id, type: 'stamp', businessId: business.id, customerId: customer.id },
        { id: memberCard.id, type: 'membership', businessId: business.id, customerId: customer.id }
      ],
      testBusiness: business,
      testCustomer: customer,
      requestIds: []
    }
  })

  test.afterAll(async () => {
    // Clean up test data
    const supabase = createAdminClient()
    
    if (context) {
      // Delete customer cards
      await supabase.from('customer_cards').delete().eq('customer_id', context.testCustomer.id)
      
      // Delete cards
      for (const card of context.testCards) {
        if (card.type === 'stamp') {
          await supabase.from('stamp_cards').delete().eq('id', card.id)
        } else {
          await supabase.from('membership_cards').delete().eq('id', card.id)
        }
      }
      
      // Delete customer and business
      await supabase.from('customers').delete().eq('id', context.testCustomer.id)
      await supabase.from('businesses').delete().eq('id', context.testBusiness.id)
    }
  })

  test('should create and provision stamp card wallet passes', async ({ page }) => {
    await test.step('Navigate to admin wallet provisioning', async () => {
      await page.goto('/admin/wallet-provision')
      await expect(page.locator('h1')).toContainText('Wallet Provisioning')
    })

    await test.step('Generate wallet passes for stamp card', async () => {
      const stampCard = context.testCards.find(c => c.type === 'stamp')!
      
      // Fill provisioning form
      await page.fill('[data-testid="card-id-input"]', stampCard.id)
      await page.fill('[data-testid="customer-id-input"]', stampCard.customerId!)
      await page.check('[data-testid="apple-wallet-checkbox"]')
      await page.check('[data-testid="google-wallet-checkbox"]')
      await page.check('[data-testid="pwa-wallet-checkbox"]')
      
      // Submit request
      await page.click('[data-testid="generate-button"]')
      
      // Verify request was created
      await expect(page.locator('[data-testid="request-status"]')).toContainText('queued')
      
      // Extract request ID for monitoring
      const requestId = await page.locator('[data-testid="request-id"]').textContent()
      context.requestIds.push(requestId!)
    })

    await test.step('Monitor generation progress', async () => {
      const requestId = context.requestIds[context.requestIds.length - 1]
      
      // Wait for completion (with timeout)
      let attempts = 0
      const maxAttempts = 30 // 60 seconds total
      
      while (attempts < maxAttempts) {
        await page.reload()
        const status = await page.locator('[data-testid="request-status"]').textContent()
        
        if (status === 'completed') {
          break
        } else if (status === 'failed') {
          throw new Error('Wallet generation failed')
        }
        
        await page.waitForTimeout(2000)
        attempts++
      }
      
      if (attempts === maxAttempts) {
        throw new Error('Wallet generation timed out')
      }
      
      // Verify all wallet types were generated
      await expect(page.locator('[data-testid="apple-wallet-status"]')).toContainText('success')
      await expect(page.locator('[data-testid="google-wallet-status"]')).toContainText('success')
      await expect(page.locator('[data-testid="pwa-wallet-status"]')).toContainText('success')
    })

    await test.step('Test wallet downloads', async () => {
      // Test Apple Wallet download
      const appleDownload = page.waitForDownload()
      await page.click('[data-testid="download-apple-wallet"]')
      const appleFile = await appleDownload
      expect(appleFile.suggestedFilename()).toMatch(/\.pkpass$/)
      
      // Test Google Wallet redirect
      await page.click('[data-testid="save-google-wallet"]')
      await expect(page).toHaveURL(/pay\.google\.com/)
      await page.goBack()
      
      // Test PWA wallet view
      await page.click('[data-testid="view-pwa-wallet"]')
      await expect(page.locator('[data-testid="pwa-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="pwa-card-title"]')).toContainText('E2E Test Stamp Card')
    })
  })

  test('should create and provision membership card wallet passes', async ({ page }) => {
    const memberCard = context.testCards.find(c => c.type === 'membership')!
    
    await test.step('Generate membership wallet passes', async () => {
      await page.goto('/admin/wallet-provision')
      
      // Fill form for membership card
      await page.fill('[data-testid="card-id-input"]', memberCard.id)
      await page.fill('[data-testid="customer-id-input"]', memberCard.customerId!)
      await page.selectOption('[data-testid="wallet-types"]', ['apple', 'google', 'pwa'])
      await page.selectOption('[data-testid="priority"]', 'high')
      
      await page.click('[data-testid="generate-button"]')
      
      // Wait for completion
      await expect(page.locator('[data-testid="request-status"]')).toContainText('completed', { timeout: 60000 })
    })

    await test.step('Verify membership card data integrity', async () => {
      // Check that membership-specific data is present
      await page.click('[data-testid="view-pwa-wallet"]')
      
      await expect(page.locator('[data-testid="membership-type"]')).toContainText('premium')
      await expect(page.locator('[data-testid="sessions-used"]')).toContainText('3')
      await expect(page.locator('[data-testid="total-sessions"]')).toContainText('20')
      await expect(page.locator('[data-testid="cost"]')).toContainText('$99.99')
    })
  })

  test('should handle wallet generation errors gracefully', async ({ page }) => {
    await test.step('Test with invalid card ID', async () => {
      await page.goto('/admin/wallet-provision')
      
      await page.fill('[data-testid="card-id-input"]', 'invalid-card-id')
      await page.click('[data-testid="generate-button"]')
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Card not found')
    })

    await test.step('Test with disabled features', async () => {
      // This would require setting environment variables to disable features
      // In a real test, you might mock the feature flag service
      console.log('Feature flag testing would be implemented here')
    })
  })

  test('should verify data consistency across wallet formats', async ({ page }) => {
    const stampCard = context.testCards.find(c => c.type === 'stamp')!
    
    await test.step('Run verification service', async () => {
      // Use the verification service directly
      const verification = await walletVerificationService.verifyWalletChain(
        stampCard.id,
        stampCard.customerId
      )
      
      expect(verification.status).toBe('completed')
      expect(verification.summary.critical).toBe(0)
      
      // Check specific tests passed
      const dataConsistency = verification.results.find(r => r.test.id === 'data_consistency')
      expect(dataConsistency?.passed).toBe(true)
      
      const appleStructure = verification.results.find(r => r.test.id === 'apple_pass_structure')
      expect(appleStructure?.passed).toBe(true)
      
      const googleStructure = verification.results.find(r => r.test.id === 'google_jwt_structure')
      expect(googleStructure?.passed).toBe(true)
    })

    await test.step('Verify barcode consistency', async () => {
      await page.goto('/admin/wallet-provision')
      
      // Generate wallets
      await page.fill('[data-testid="card-id-input"]', stampCard.id)
      await page.fill('[data-testid="customer-id-input"]', stampCard.customerId!)
      await page.check('[data-testid="apple-wallet-checkbox"]')
      await page.check('[data-testid="google-wallet-checkbox"]')
      await page.check('[data-testid="pwa-wallet-checkbox"]')
      await page.click('[data-testid="generate-button"]')
      
      await expect(page.locator('[data-testid="request-status"]')).toContainText('completed', { timeout: 60000 })
      
      // Check barcode values are consistent
      const barcodeValues = await page.locator('[data-testid="barcode-value"]').all()
      const firstValue = await barcodeValues[0].textContent()
      
      for (const barcodeElement of barcodeValues) {
        const value = await barcodeElement.textContent()
        expect(value).toBe(firstValue)
      }
    })
  })

  test('should handle queue management correctly', async ({ page }) => {
    await test.step('Test queue status monitoring', async () => {
      await page.goto('/admin/wallet-provision/queue')
      
      // Verify queue status page loads
      await expect(page.locator('[data-testid="queue-status"]')).toBeVisible()
      
      // Check statistics
      await expect(page.locator('[data-testid="total-processed"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-rate"]')).toBeVisible()
      await expect(page.locator('[data-testid="average-processing-time"]')).toBeVisible()
    })

    await test.step('Test multiple concurrent requests', async () => {
      const requests = []
      
      // Submit multiple requests quickly
      for (const card of context.testCards) {
        const requestPromise = walletGenerationService.enqueueGeneration({
          cardId: card.id,
          customerId: card.customerId,
          types: ['pwa'], // Use fastest generation type
          priority: 'normal'
        })
        requests.push(requestPromise)
      }
      
      const requestIds = await Promise.all(requests)
      context.requestIds.push(...requestIds)
      
      // Verify all requests are processed
      for (const requestId of requestIds) {
        let attempts = 0
        while (attempts < 30) {
          const result = walletGenerationService.getResult(requestId)
          if (result) {
            expect(result.success).toBe(true)
            break
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
        }
        
        if (attempts === 30) {
          throw new Error(`Request ${requestId} was not processed within timeout`)
        }
      }
    })
  })

  test('should integrate with admin card creation flow', async ({ page }) => {
    await test.step('Create new card via admin interface', async () => {
      await page.goto('/admin/cards/new')
      
      // Fill card creation form
      await page.selectOption('[data-testid="business-select"]', context.testBusiness.id)
      await page.fill('[data-testid="card-name"]', 'Integration Test Card')
      await page.selectOption('[data-testid="card-type"]', 'stamp')
      await page.fill('[data-testid="total-stamps"]', '8')
      await page.fill('[data-testid="reward-description"]', 'Free item after 8 stamps')
      
      // Enable wallet generation
      await page.check('[data-testid="generate-wallets-checkbox"]')
      await page.check('[data-testid="apple-wallet-option"]')
      await page.check('[data-testid="google-wallet-option"]')
      
      // Submit form
      await page.click('[data-testid="create-card-button"]')
      
      // Verify card was created and wallets were queued
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Card created successfully')
      await expect(page.locator('[data-testid="wallet-generation-status"]')).toContainText('Wallet generation queued')
    })

    await test.step('Verify integrated workflow completed', async () => {
      // Check that we can see the card in the admin cards list
      await page.goto('/admin/cards')
      await expect(page.locator('[data-testid="card-name"]').last()).toContainText('Integration Test Card')
      
      // Verify wallet status
      await page.click('[data-testid="view-card-details"]')
      await expect(page.locator('[data-testid="wallet-status"]')).toContainText('Generated')
    })
  })
})

// Helper function to wait for wallet generation completion
async function waitForWalletGeneration(requestId: string, timeoutMs: number = 60000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeoutMs) {
    const result = walletGenerationService.getResult(requestId)
    if (result) {
      return result.success
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  throw new Error(`Wallet generation timed out for request ${requestId}`)
}

// Test data cleanup helper
async function cleanupTestData(testContext: WalletTestContext) {
  const supabase = createAdminClient()
  
  try {
    // Clean up in reverse order of creation
    if (testContext.testCustomer) {
      await supabase.from('customer_cards').delete().eq('customer_id', testContext.testCustomer.id)
      await supabase.from('customers').delete().eq('id', testContext.testCustomer.id)
    }
    
    for (const card of testContext.testCards) {
      const table = card.type === 'stamp' ? 'stamp_cards' : 'membership_cards'
      await supabase.from(table).delete().eq('id', card.id)
    }
    
    if (testContext.testBusiness) {
      await supabase.from('businesses').delete().eq('id', testContext.testBusiness.id)
    }
    
    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error)
  }
}