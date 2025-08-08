/**
 * E2E Tests for Wallet Chain Diagnostic Tools
 * 
 * Tests all wallet chain diagnostic tools functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Wallet Chain Diagnostic Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login and authenticate
    await page.goto('/admin/login')
    
    // Mock admin authentication
    await page.route('/api/admin/auth-check', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'admin-1', email: 'admin@test.com', role_id: 1 }
        })
      })
    })
    
    // Navigate to wallet chain tools
    await page.goto('/admin/dev-tools/wallet-chain')
  })

  test('displays wallet chain tools page correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Wallet Chain Diagnostics')
    await expect(page.locator('[data-testid="health-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="validator-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="preview-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="queue-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="simulator-tab"]')).toBeVisible()
  })

  test('health dashboard loads and displays data', async ({ page }) => {
    // Mock health API response
    await page.route('/api/admin/wallet-chain/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overall: 'healthy',
            timestamp: new Date().toISOString(),
            components: {
              supabase: { status: 'healthy', connectivity: true, responseTime: 150, tables: {} },
              queue: { status: 'healthy', pending: 0, processing: 0, completed: 10, failed: 0, successRate: 100, averageProcessingTime: 1500 },
              environment: { status: 'healthy', featureFlags: {}, missingVariables: [], warnings: [] },
              platforms: {
                apple: { status: 'healthy', configured: true },
                google: { status: 'healthy', configured: true },
                pwa: { status: 'healthy', configured: true }
              }
            },
            recentActivity: {
              lastHour: 5,
              last24Hours: 25,
              last7Days: 100,
              recentErrors: []
            }
          }
        })
      })
    })

    await page.click('[data-value="health"]')
    await expect(page.locator('text=Database')).toBeVisible()
    await expect(page.locator('text=150ms')).toBeVisible()
    await expect(page.locator('text=healthy')).toBeVisible()
  })

  test('card data validator validates card data', async ({ page }) => {
    // Mock validation API response
    await page.route('/api/admin/wallet-chain/validate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cardId: 'test-card-123',
            cardType: 'stamp',
            overall: 'valid',
            validations: {
              dataIntegrity: { valid: true, errors: [], warnings: [] },
              appleWallet: { valid: true, errors: [], warnings: [], requirements: { formatVersion: true, passTypeIdentifier: true, serialNumber: true, organizationName: true, description: true, barcodes: true } },
              googleWallet: { valid: true, errors: [], warnings: [], requirements: { classId: true, objectId: true, state: true, barcode: true, textModules: true } },
              pwa: { valid: true, errors: [], warnings: [], requirements: { title: true, subtitle: true, barcode: true, theme: true, actions: true } }
            },
            recommendations: [],
            timestamp: new Date().toISOString()
          }
        })
      })
    })

    await page.click('[data-value="validator"]')
    await page.fill('input[placeholder="Enter card ID"]', 'test-card-123')
    await page.click('button:has-text("Validate")')
    
    await expect(page.locator('text=valid')).toBeVisible()
    await expect(page.locator('text=test-card-123')).toBeVisible()
  })

  test('wallet preview generates previews', async ({ page }) => {
    // Mock preview API response
    await page.route('/api/admin/wallet-chain/preview', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cardId: 'test-card-123',
            cardType: 'stamp',
            previews: {
              apple: { success: true, data: { passTypeIdentifier: 'pass.com.example.loyalty' } },
              google: { success: true, data: { classId: 'test-class-1' } },
              pwa: { success: true, data: { title: 'Test Card' } }
            },
            timestamp: new Date().toISOString(),
            processingTime: 500
          }
        })
      })
    })

    await page.click('[data-value="preview"]')
    await page.fill('input[placeholder="Enter card ID"]', 'test-card-123')
    await page.click('button:has-text("Preview")')
    
    await expect(page.locator('text=Generated Successfully')).toBeVisible()
    await expect(page.locator('text=500ms')).toBeVisible()
  })

  test('queue inspector loads queue data', async ({ page }) => {
    // Mock queue API response
    await page.route('/api/admin/wallet-chain/queue', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            queue: {
              pending: [
                {
                  id: 'req-1',
                  card_id: 'card-123',
                  platform: 'apple',
                  priority: 'normal',
                  status: 'pending',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  retry_count: 0
                }
              ],
              processing: [],
              completed: [],
              failed: []
            },
            statistics: {
              totalItems: 1,
              successRate: 100,
              averageProcessingTime: 1500,
              peakHours: [],
              platformBreakdown: { apple: 1 },
              errorFrequency: []
            },
            health: {
              queueLength: 1,
              oldestPendingAge: 30,
              processingCapacity: 3,
              recommendedActions: ['Queue is operating normally']
            }
          }
        })
      })
    })

    await page.click('[data-value="queue"]')
    await expect(page.locator('text=Pending Items (1)')).toBeVisible()
    await expect(page.locator('text=card-123')).toBeVisible()
  })

  test('test simulator runs simulations', async ({ page }) => {
    // Mock simulator API response
    await page.route('/api/admin/wallet-chain/test-simulator', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            action: 'simulate_flow',
            success: true,
            data: {
              flowCompleted: true,
              customerId: 'test-customer-1',
              cardId: 'test-card-1',
              requestId: 'test-request-1'
            },
            testEntities: {
              customers: ['test-customer-1'],
              cards: ['test-card-1'],
              walletRequests: ['test-request-1']
            },
            metrics: {
              totalTime: 5000,
              successRate: 100,
              errors: []
            }
          }
        })
      })
    })

    await page.click('[data-value="simulator"]')
    await page.click('button:has-text("Run Quick Test")')
    
    await expect(page.locator('text=Success')).toBeVisible()
    await expect(page.locator('text=100%')).toBeVisible()
  })

  test('navigation between tabs works without page reload', async ({ page }) => {
    // Verify tabs switch content without reload
    await page.click('[data-value="health"]')
    await expect(page.locator('text=Health Dashboard')).toBeVisible()
    
    await page.click('[data-value="validator"]')
    await expect(page.locator('text=Card Data Validator')).toBeVisible()
    
    await page.click('[data-value="preview"]')
    await expect(page.locator('text=One-Click Wallet Preview')).toBeVisible()
    
    await page.click('[data-value="queue"]')
    await expect(page.locator('text=Queue Inspector')).toBeVisible()
    
    await page.click('[data-value="simulator"]')
    await expect(page.locator('text=Test Customer Simulator')).toBeVisible()
  })

  test('real-time updates work with SWR', async ({ page }) => {
    let healthCallCount = 0
    
    await page.route('/api/admin/wallet-chain/health', async route => {
      healthCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overall: 'healthy',
            timestamp: new Date().toISOString(),
            components: {
              supabase: { status: 'healthy', connectivity: true, responseTime: 150 + healthCallCount * 10, tables: {} },
              queue: { status: 'healthy', pending: healthCallCount, processing: 0, completed: 10, failed: 0, successRate: 100, averageProcessingTime: 1500 },
              environment: { status: 'healthy', featureFlags: {}, missingVariables: [], warnings: [] },
              platforms: {
                apple: { status: 'healthy', configured: true },
                google: { status: 'healthy', configured: true },
                pwa: { status: 'healthy', configured: true }
              }
            },
            recentActivity: { lastHour: 5, last24Hours: 25, last7Days: 100, recentErrors: [] }
          }
        })
      })
    })

    await page.click('[data-value="health"]')
    
    // Wait for initial load
    await expect(page.locator('text=160ms')).toBeVisible()
    
    // Wait for refresh and check updated data
    await page.waitForTimeout(35000) // SWR refreshes every 30 seconds
    await expect(page.locator('text=170ms')).toBeVisible()
    
    expect(healthCallCount).toBeGreaterThan(1)
  })

  test('error handling displays appropriate messages', async ({ page }) => {
    // Mock API error
    await page.route('/api/admin/wallet-chain/validate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Card not found'
        })
      })
    })

    await page.click('[data-value="validator"]')
    await page.fill('input[placeholder="Enter card ID"]', 'invalid-card')
    await page.click('button:has-text("Validate")')
    
    await expect(page.locator('text=Card not found')).toBeVisible()
  })
})

test.describe('Wallet Chain Tools Integration', () => {
  test('tools integrate with existing admin navigation', async ({ page }) => {
    await page.goto('/admin/dev-tools')
    
    await expect(page.locator('text=Wallet Chain Diagnostics')).toBeVisible()
    await page.click('text=Wallet Chain Diagnostics')
    
    await expect(page.url()).toContain('/admin/dev-tools/wallet-chain')
  })

  test('maintains admin authentication requirements', async ({ page }) => {
    // Test without authentication
    await page.route('/api/admin/auth-check', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Authentication required'
        })
      })
    })

    await page.goto('/admin/dev-tools/wallet-chain')
    
    // Should redirect to login or show auth error
    await expect(page.locator('text=Sign In')).toBeVisible()
  })
})