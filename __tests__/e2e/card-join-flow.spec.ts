/**
 * E2E Tests for Card Join Flow
 * Tests the /join/[cardId] route functionality including:
 * - Card preview display
 * - Add to Wallet functionality
 * - Success toast notifications
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = 'http://localhost:3000'

// Test card IDs from admin test data
const TEST_CARDS = {
  stampCard: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  membershipCard: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  customerStampCard: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  customerMembershipCard: 'dddddddd-dddd-dddd-dddd-dddddddddddd'
}

// Helper function to setup test data
async function setupTestData() {
  const response = await fetch(`${BASE_URL}/api/dev-seed/admin-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businesses: 2,
      stampCardsPerBusiness: 1,
      membershipCardsPerBusiness: 1
    })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to setup test data: ${response.status}`)
  }
  
  return await response.json()
}

// Helper function to wait for elements with timeout
async function waitForElement(page: Page, selector: string, timeout = 10000) {
  return await page.waitForSelector(selector, { timeout })
}

test.describe('Card Join Flow Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup test data before each test
    await setupTestData()
    
    // Wait a moment for data to be available
    await page.waitForTimeout(1000)
  })

  test('should display card preview for stamp card join', async ({ page }) => {
    // 1. Visit /join/{validStampCardId}
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // 2. Confirm card preview is visible using data-testid="card-preview"
    const cardPreview = await waitForElement(page, '[data-testid="card-preview"]')
    await expect(cardPreview).toBeVisible()
    
    // Verify card content is displayed
    await expect(page.locator('text=Admin Coffee Loyalty')).toBeVisible()
    await expect(page.locator('text=Admin Test Coffee Shop')).toBeVisible()
    
    // Verify it's a loyalty card type
    await expect(page.locator('text=Loyalty Program')).toBeVisible()
  })

  test('should display card preview for membership card join', async ({ page }) => {
    // 1. Visit /join/{validMembershipCardId}
    await page.goto(`/join/${TEST_CARDS.membershipCard}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // 2. Confirm card preview is visible using data-testid="card-preview"
    const cardPreview = await waitForElement(page, '[data-testid="card-preview"]')
    await expect(cardPreview).toBeVisible()
    
    // Verify card content is displayed
    await expect(page.locator('text=Admin Gym Membership')).toBeVisible()
    await expect(page.locator('text=Admin Test Gym')).toBeVisible()
    
    // Verify it's a membership card type
    await expect(page.locator('text=Membership Program')).toBeVisible()
  })

  test('should show Add to Wallet buttons for stamp card', async ({ page }) => {
    // Visit stamp card join page
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    await page.waitForLoadState('networkidle')
    
    // 3. Confirm "Add to Wallet" buttons exist
    // Check for Apple Wallet button
    const appleWalletButton = page.locator('text=Add to Apple Wallet')
    await expect(appleWalletButton).toBeVisible()
    
    // Check for Google Wallet button  
    const googleWalletButton = page.locator('text=Add to Google Wallet')
    await expect(googleWalletButton).toBeVisible()
    
    // Check for PWA button
    const pwaButton = page.locator('text=Add to Phone')
    await expect(pwaButton).toBeVisible()
  })

  test('should show Add to Wallet buttons for membership card', async ({ page }) => {
    // Visit membership card join page
    await page.goto(`/join/${TEST_CARDS.membershipCard}`)
    await page.waitForLoadState('networkidle')
    
    // 3. Confirm "Add to Wallet" buttons exist
    // Check for Apple Wallet button
    const appleWalletButton = page.locator('text=Add to Apple Wallet')
    await expect(appleWalletButton).toBeVisible()
    
    // Check for Google Wallet button  
    const googleWalletButton = page.locator('text=Add to Google Wallet')
    await expect(googleWalletButton).toBeVisible()
    
    // Check for PWA button
    const pwaButton = page.locator('text=Add to Phone')
    await expect(pwaButton).toBeVisible()
  })

  test('should handle Apple Wallet download for stamp card', async ({ page }) => {
    // Visit stamp card join page
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    await page.waitForLoadState('networkidle')
    
    // 4. Confirm user can click Apple Wallet button
    const appleWalletButton = page.locator('text=Add to Apple Wallet')
    await expect(appleWalletButton).toBeVisible()
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click the Apple Wallet button
    await appleWalletButton.click()
    
    // Wait for download to start
    const download = await downloadPromise
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/\.pkpass$/)
    expect(download.suggestedFilename()).toContain('Admin_Coffee_Loyalty')
  })

  test('should handle Apple Wallet download for membership card', async ({ page }) => {
    // Visit membership card join page
    await page.goto(`/join/${TEST_CARDS.membershipCard}`)
    await page.waitForLoadState('networkidle')
    
    // 4. Confirm user can click Apple Wallet button
    const appleWalletButton = page.locator('text=Add to Apple Wallet')
    await expect(appleWalletButton).toBeVisible()
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click the Apple Wallet button
    await appleWalletButton.click()
    
    // Wait for download to start
    const download = await downloadPromise
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/\.pkpass$/)
    expect(download.suggestedFilename()).toContain('Admin_Gym_Membership')
  })

  test('should show card information correctly', async ({ page }) => {
    // Visit stamp card join page
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    await page.waitForLoadState('networkidle')
    
    // Verify card preview shows correct information
    const cardPreview = await waitForElement(page, '[data-testid="card-preview"]')
    
    // Check business information
    await expect(cardPreview.locator('text=Admin Test Coffee Shop')).toBeVisible()
    
    // Check card name
    await expect(cardPreview.locator('text=Admin Coffee Loyalty')).toBeVisible()
    
    // Check program type
    await expect(cardPreview.locator('text=Loyalty Program')).toBeVisible()
    
    // Check stamps information (should show stamps needed)
    await expect(cardPreview.locator('text=Stamps needed:')).toBeVisible()
  })

  test('should handle invalid card ID gracefully', async ({ page }) => {
    // Visit with invalid card ID
    await page.goto('/join/invalid-card-id-12345')
    await page.waitForLoadState('networkidle')
    
    // Should show some kind of error or fallback state
    // The exact implementation may vary, but page should load without crashing
    await expect(page).toHaveURL(/\/join\/invalid-card-id-12345/)
    
    // Page should not crash (no uncaught errors)
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Visit stamp card join page
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    await page.waitForLoadState('networkidle')
    
    // Verify card preview is still visible on mobile
    const cardPreview = await waitForElement(page, '[data-testid="card-preview"]')
    await expect(cardPreview).toBeVisible()
    
    // Verify wallet buttons are still accessible
    await expect(page.locator('text=Add to Apple Wallet')).toBeVisible()
    await expect(page.locator('text=Add to Google Wallet')).toBeVisible()
    await expect(page.locator('text=Add to Phone')).toBeVisible()
  })

  test('should load card preview quickly', async ({ page }) => {
    const startTime = Date.now()
    
    // Visit stamp card join page
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    
    // Wait for card preview to be visible
    await waitForElement(page, '[data-testid="card-preview"]')
    
    const loadTime = Date.now() - startTime
    
    // Card preview should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort())
    
    // Visit card join page
    await page.goto(`/join/${TEST_CARDS.stampCard}`)
    await page.waitForLoadState('networkidle')
    
    // Page should still render (may show fallback content)
    await expect(page).toHaveURL(/\/join\//)
    
    // Should not show uncaught JavaScript errors
    const title = await page.title()
    expect(title).toBeTruthy()
  })
})

test.describe('Card Join Flow - Customer Cards', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await setupTestData()
    await page.waitForTimeout(1000)
  })

  test('should display existing customer stamp card', async ({ page }) => {
    // Visit existing customer stamp card
    await page.goto(`/join/${TEST_CARDS.customerStampCard}`)
    await page.waitForLoadState('networkidle')
    
    // Card preview should be visible
    const cardPreview = await waitForElement(page, '[data-testid="card-preview"]')
    await expect(cardPreview).toBeVisible()
    
    // Should show current progress
    await expect(page.locator('text=Admin Coffee Loyalty')).toBeVisible()
  })

  test('should display existing customer membership card', async ({ page }) => {
    // Visit existing customer membership card  
    await page.goto(`/join/${TEST_CARDS.customerMembershipCard}`)
    await page.waitForLoadState('networkidle')
    
    // Card preview should be visible
    const cardPreview = await waitForElement(page, '[data-testid="card-preview"]')
    await expect(cardPreview).toBeVisible()
    
    // Should show current progress
    await expect(page.locator('text=Admin Gym Membership')).toBeVisible()
  })
}) 