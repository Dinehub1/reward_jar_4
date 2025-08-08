import { test, expect } from '@playwright/test'

test.describe('Unified Card Creation System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to card creation page
    await page.goto('/admin/cards/new')
    
    // Mock admin authentication
    await page.route('**/api/admin/auth-check', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { role_id: 1, email: 'admin@test.com' }
        })
      })
    })

    // Mock dashboard data for businesses
    await page.route('**/api/admin/dashboard-unified*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'test-business-1',
              name: 'Test Coffee Shop',
              contact_email: 'test@coffee.com',
              description: 'A cozy coffee shop',
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 'test-business-2', 
              name: 'Test Gym',
              contact_email: 'test@gym.com',
              description: 'A modern fitness center',
              created_at: '2024-01-01T00:00:00Z'
            }
          ]
        })
      })
    })
  })

  test('should show card type selection first', async ({ page }) => {
    // Should show card type selection page
    await expect(page.getByText('Create New Card')).toBeVisible()
    await expect(page.getByText('Choose the type of card you want to create')).toBeVisible()
    
    // Should show both card type options
    await expect(page.getByText('Stamp Card')).toBeVisible()
    await expect(page.getByText('Membership Card')).toBeVisible()
    
    // Should show descriptions
    await expect(page.getByText('Reward customers with stamps for purchases')).toBeVisible()
    await expect(page.getByText('Manage access control and membership benefits')).toBeVisible()
    
    // Should show completion time estimates
    await expect(page.getByText('2-3 minutes')).toBeVisible()
    await expect(page.getByText('3-5 minutes')).toBeVisible()
    
    // Should show examples
    await expect(page.getByText('Coffee shops')).toBeVisible()
    await expect(page.getByText('Gyms')).toBeVisible()
  })

  test('should proceed to stamp card creation with side-by-side layout', async ({ page }) => {
    // Click on Stamp Card
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Should navigate to unified creation page
    await expect(page.getByText('Create Stamp Card')).toBeVisible()
    
    // Should show side-by-side layout
    await expect(page.getByText('Card Details')).toBeVisible()
    await expect(page.getByText('Live Preview')).toBeVisible()
    
    // Should show Quick/Advanced mode toggle
    await expect(page.getByText('Quick Mode')).toBeVisible()
    await expect(page.getByText('Advanced')).toBeVisible()
    
    // Should show template selection in Quick Mode
    await expect(page.getByText('Choose Template')).toBeVisible()
    
    // Should show all 6 stamp card templates
    await expect(page.getByText('Coffee Shop')).toBeVisible()
    await expect(page.getByText('Restaurant')).toBeVisible()
    await expect(page.getByText('Salon & Spa')).toBeVisible()
    await expect(page.getByText('Retail Store')).toBeVisible()
    await expect(page.getByText('Fitness & Gym')).toBeVisible()
    await expect(page.getByText('Healthcare')).toBeVisible()
  })

  test('should proceed to membership card creation', async ({ page }) => {
    // Click on Membership Card
    await page.getByRole('article').filter({ hasText: 'Membership Card' }).click()
    
    // Should navigate to unified creation page
    await expect(page.getByText('Create Membership Card')).toBeVisible()
    
    // Should show membership-specific templates
    await expect(page.getByText('Gym')).toBeVisible()
    await expect(page.getByText('Club')).toBeVisible()
    await expect(page.getByText('Spa')).toBeVisible()
    await expect(page.getByText('Coworking')).toBeVisible()
    
    // Should show membership-specific fields
    await expect(page.getByText('Membership Type')).toBeVisible()
    await expect(page.getByText('Total Sessions')).toBeVisible()
    await expect(page.getByText('Duration (Days)')).toBeVisible()
  })

  test('should update live preview in real-time', async ({ page }) => {
    // Go to stamp card creation
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Select business
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    
    // Select template
    await page.getByText('Coffee Shop').first().click()
    
    // Should show live preview updating
    await expect(page.getByText('Test Coffee Shop')).toBeVisible()
    await expect(page.getByText('Live Preview')).toBeVisible()
    
    // Change card name
    const cardNameInput = page.getByLabelText('Card Name *')
    await cardNameInput.fill('My Coffee Rewards')
    
    // Preview should update with new name
    await expect(page.getByText('My Coffee Rewards')).toBeVisible()
    
    // Change reward
    const rewardInput = page.getByLabelText('Reward *')
    await rewardInput.fill('Free Latte')
    
    // Preview should update with new reward
    await expect(page.getByText('Free Latte')).toBeVisible()
  })

  test('should toggle between Quick and Advanced modes', async ({ page }) => {
    // Go to stamp card creation
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Should start in Quick Mode
    await expect(page.getByText('Choose Template')).toBeVisible()
    
    // Toggle to Advanced Mode
    await page.getByRole('switch').click()
    
    // Should show advanced fields
    await expect(page.getByText('Advanced Settings')).toBeVisible()
    await expect(page.getByText('Card Description')).toBeVisible()
    
    // Toggle back to Quick Mode
    await page.getByRole('switch').click()
    
    // Should show template selection again
    await expect(page.getByText('Choose Template')).toBeVisible()
  })

  test('should switch between preview platforms', async ({ page }) => {
    // Go to stamp card creation
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Select business and template to enable preview
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    await page.getByText('Coffee Shop').first().click()
    
    // Should show platform switcher
    await expect(page.getByText('Apple')).toBeVisible()
    await expect(page.getByText('Google')).toBeVisible()
    await expect(page.getByText('PWA')).toBeVisible()
    
    // Click on Google platform
    await page.getByText('Google').click()
    
    // Should show Google Wallet preview
    await expect(page.getByText('Google')).toHaveClass(/bg-white/)
    
    // Click on PWA platform
    await page.getByText('PWA').click()
    
    // Should show PWA preview
    await expect(page.getByText('PWA')).toHaveClass(/bg-white/)
  })

  test('should show dimension compliance warnings', async ({ page }) => {
    // Go to stamp card creation
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Select business
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    
    // Enter a very long card name
    const cardNameInput = page.getByLabelText('Card Name *')
    await cardNameInput.fill('This is a very very very long card name that exceeds recommended limits')
    
    // Should show optimization suggestions
    await expect(page.getByText('Optimization Suggestions')).toBeVisible()
    await expect(page.getByText('Card name too long')).toBeVisible()
  })

  test('should complete stamp card creation end-to-end', async ({ page }) => {
    // Mock card creation API
    await page.route('**/api/admin/cards', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-card-123',
              card_name: 'Test Coffee Card',
              business_id: 'test-business-1',
              reward: 'Free Coffee'
            }
          })
        })
      }
    })

    // Go to stamp card creation
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Fill required fields
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    
    await page.getByText('Coffee Shop').first().click()
    
    const cardNameInput = page.getByLabelText('Card Name *')
    await cardNameInput.fill('Test Coffee Loyalty Card')
    
    const rewardInput = page.getByLabelText('Reward *')
    await rewardInput.fill('Free Coffee')
    
    // Create the card
    await page.getByText('Create Card').click()
    
    // Should redirect to cards list
    await page.waitForURL('**/admin/cards')
  })

  test('should complete membership card creation end-to-end', async ({ page }) => {
    // Mock card creation API
    await page.route('**/api/admin/cards', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-membership-123',
              card_name: 'Test Gym Membership',
              business_id: 'test-business-2',
              membership_type: 'gym'
            }
          })
        })
      }
    })

    // Go to membership card creation
    await page.getByRole('article').filter({ hasText: 'Membership Card' }).click()
    
    // Fill required fields
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Gym').click()
    
    await page.getByText('Gym').first().click()
    
    const cardNameInput = page.getByLabelText('Card Name *')
    await cardNameInput.fill('Test Gym Membership Card')
    
    // Should show membership-specific fields
    await expect(page.getByLabelText('Total Sessions')).toBeVisible()
    await expect(page.getByLabelText('Duration (Days)')).toBeVisible()
    
    // Create the card
    await page.getByText('Create Card').click()
    
    // Should redirect to cards list
    await page.waitForURL('**/admin/cards')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/admin/cards', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid card data provided'
          })
        })
      }
    })

    // Go to stamp card creation
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    
    // Fill minimum required fields
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    
    const cardNameInput = page.getByLabelText('Card Name *')
    await cardNameInput.fill('Test Card')
    
    // Try to create the card
    await page.getByText('Create Card').click()
    
    // Should show error message
    await expect(page.getByText('Error: Invalid card data provided')).toBeVisible()
  })

  test('should show sticky preview during scrolling', async ({ page }) => {
    // Go to stamp card creation and enable advanced mode
    await page.getByRole('article').filter({ hasText: 'Stamp Card' }).click()
    await page.getByRole('switch').click() // Enable advanced mode
    
    // Fill some fields to enable preview
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    
    // Preview should still be visible (sticky)
    await expect(page.getByText('Live Preview')).toBeVisible()
  })
})