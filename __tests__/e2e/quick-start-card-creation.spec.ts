import { test, expect } from '@playwright/test'

test.describe('Quick Start Card Creation', () => {
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

    // Mock businesses data
    await page.route('**/api/admin/businesses', async route => {
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
              logo_url: 'https://example.com/logo.jpg'
            },
            {
              id: 'test-business-2', 
              name: 'Test Restaurant',
              contact_email: 'test@restaurant.com',
              logo_url: null
            }
          ]
        })
      })
    })
  })

  test('should display mode selection by default', async ({ page }) => {
    // Should show mode selection page
    await expect(page.getByText('Create New Card')).toBeVisible()
    await expect(page.getByText('Choose how you\'d like to create your loyalty card')).toBeVisible()
    
    // Should show both Quick Start and Advanced Mode cards
    await expect(page.getByText('Quick Start')).toBeVisible()
    await expect(page.getByText('Advanced Mode')).toBeVisible()
    
    // Should show features and time estimates
    await expect(page.getByText('~2 minutes')).toBeVisible()
    await expect(page.getByText('~8-12 minutes')).toBeVisible()
    
    // Should show feature comparison table
    await expect(page.getByText('Feature Comparison')).toBeVisible()
  })

  test('should enter Quick Start mode when selected', async ({ page }) => {
    // Click on Quick Start card
    await page.getByText('Quick Start').first().click()
    
    // Should navigate to Quick Start wizard
    await expect(page.getByText('Quick Start')).toBeVisible()
    await expect(page.getByText('Create your card in under 2 minutes')).toBeVisible()
    
    // Should show step 1: Choose Template
    await expect(page.getByText('Choose Template')).toBeVisible()
    await expect(page.getByText('Choose Your Business Type')).toBeVisible()
    
    // Should show all 6 templates
    await expect(page.getByText('Coffee Shop')).toBeVisible()
    await expect(page.getByText('Restaurant')).toBeVisible()
    await expect(page.getByText('Salon & Spa')).toBeVisible()
    await expect(page.getByText('Retail Store')).toBeVisible()
    await expect(page.getByText('Fitness & Gym')).toBeVisible()
    await expect(page.getByText('Healthcare')).toBeVisible()
  })

  test('should complete Quick Start flow end-to-end', async ({ page }) => {
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

    // Enter Quick Start mode
    await page.getByText('Quick Start').first().click()
    
    // Step 1: Select Coffee Shop template
    await page.getByText('Coffee Shop').first().click()
    await page.getByText('Next').click()
    
    // Step 2: Fill basic details
    await expect(page.getByText('Basic Details')).toBeVisible()
    
    // Select business
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    
    // Card name should be auto-filled
    const cardNameInput = page.getByLabelText('Card Name *')
    await expect(cardNameInput).toHaveValue(/Coffee/)
    
    // Reward should be pre-filled from template
    const rewardInput = page.getByLabelText('Reward *')
    await expect(rewardInput).toHaveValue('Free Coffee')
    
    // Customize card name
    await cardNameInput.fill('Test Coffee Loyalty Card')
    
    // Stamps should default to 10 (coffee shop template)
    await expect(page.getByText('Stamps Required: 10')).toBeVisible()
    
    // Go to next step
    await page.getByText('Next').click()
    
    // Step 3: Preview & Create
    await expect(page.getByText('Review & Create')).toBeVisible()
    await expect(page.getByText('Your Card Preview')).toBeVisible()
    
    // Should show card summary
    await expect(page.getByText('Card Summary')).toBeVisible()
    await expect(page.getByText('Test Coffee Shop')).toBeVisible()
    await expect(page.getByText('Test Coffee Loyalty Card')).toBeVisible()
    await expect(page.getByText('Free Coffee')).toBeVisible()
    
    // Create the card
    await page.getByText('Create Quick Card').click()
    
    // Should redirect to cards list with success
    await page.waitForURL('**/admin/cards?created=true&mode=quick')
  })

  test('should validate required fields in Quick Start', async ({ page }) => {
    // Enter Quick Start mode
    await page.getByText('Quick Start').first().click()
    
    // Try to proceed without selecting template
    await page.getByText('Next').click()
    
    // Should show template selection error
    await expect(page.getByText('Please select a template')).toBeVisible()
    
    // Select template and proceed
    await page.getByText('Coffee Shop').first().click()
    await page.getByText('Next').click()
    
    // Clear required fields and try to proceed
    await page.getByLabelText('Card Name *').fill('')
    await page.getByLabelText('Reward *').fill('')
    await page.getByText('Next').click()
    
    // Should show validation errors
    await expect(page.getByText('Card name is required')).toBeVisible()
    await expect(page.getByText('Reward is required')).toBeVisible()
    await expect(page.getByText('Please select a business')).toBeVisible()
  })

  test('should allow switching between Quick and Advanced modes', async ({ page }) => {
    // Start in Quick Start mode
    await page.getByText('Quick Start').first().click()
    await expect(page.getByText('Quick Start Mode')).toBeVisible()
    
    // Switch to Advanced
    await page.getByText('Switch to Advanced').click()
    await expect(page.getByText('Advanced Mode')).toBeVisible()
    await expect(page.getByText('Card Details')).toBeVisible()
    
    // Switch back to Quick Start
    await page.getByText('Switch to Quick Start').click()
    await expect(page.getByText('Quick Start Mode')).toBeVisible()
    await expect(page.getByText('Choose Template')).toBeVisible()
  })

  test('should show template-specific suggestions and auto-generation', async ({ page }) => {
    // Enter Quick Start mode
    await page.getByText('Quick Start').first().click()
    
    // Select Restaurant template
    await page.getByText('Restaurant').first().click()
    await page.getByText('Next').click()
    
    // Should show restaurant-specific reward suggestions
    await expect(page.getByText('Popular rewards for Restaurant:')).toBeVisible()
    await expect(page.getByText('Free Main Course')).toBeVisible()
    await expect(page.getByText('Free Appetizer')).toBeVisible()
    
    // Click on a suggestion
    await page.getByText('Free Main Course').click()
    
    // Should update the reward field
    const rewardInput = page.getByLabelText('Reward *')
    await expect(rewardInput).toHaveValue('Free Main Course')
    
    // Stamps should default to 8 (restaurant template)
    await expect(page.getByText('Stamps Required: 8')).toBeVisible()
  })

  test('should show real-time preview updates', async ({ page }) => {
    // Enter Quick Start mode and complete template selection
    await page.getByText('Quick Start').first().click()
    await page.getByText('Coffee Shop').first().click()
    await page.getByText('Next').click()
    
    // Fill basic details
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    await page.getByLabelText('Card Name *').fill('My Custom Coffee Card')
    await page.getByLabelText('Reward *').fill('Free Latte')
    
    // Go to preview step
    await page.getByText('Next').click()
    
    // Should show preview with updated content
    await expect(page.getByText('My Custom Coffee Card')).toBeVisible()
    await expect(page.getByText('Free Latte')).toBeVisible()
    
    // Should show wallet preview component
    await expect(page.getByText('Your Card Preview')).toBeVisible()
  })

  test('should handle pre-selected business ID from URL', async ({ page }) => {
    // Navigate with business ID in URL
    await page.goto('/admin/cards/new?businessId=test-business-1')
    
    // Enter Quick Start mode
    await page.getByText('Quick Start').first().click()
    await page.getByText('Coffee Shop').first().click()
    await page.getByText('Next').click()
    
    // Business should be pre-selected
    await expect(page.getByText('Test Coffee Shop')).toBeVisible()
    
    // Card name should include business name
    const cardNameInput = page.getByLabelText('Card Name *')
    await expect(cardNameInput).toHaveValue(/Test Coffee Shop/)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error for card creation
    await page.route('**/api/admin/cards', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Database connection failed'
          })
        })
      }
    })

    // Complete Quick Start flow
    await page.getByText('Quick Start').first().click()
    await page.getByText('Coffee Shop').first().click()
    await page.getByText('Next').click()
    
    await page.getByRole('combobox').first().click()
    await page.getByText('Test Coffee Shop').click()
    await page.getByLabelText('Card Name *').fill('Test Card')
    
    await page.getByText('Next').click()
    await page.getByText('Create Quick Card').click()
    
    // Should show error message
    await expect(page.getByText('Database connection failed')).toBeVisible()
  })

  test('should support all template types with correct defaults', async ({ page }) => {
    const templates = [
      { name: 'Coffee Shop', stamps: 10, emoji: '☕' },
      { name: 'Restaurant', stamps: 8, emoji: '🍕' },
      { name: 'Salon & Spa', stamps: 6, emoji: '💅' },
      { name: 'Retail Store', stamps: 12, emoji: '🛍️' },
      { name: 'Fitness & Gym', stamps: 15, emoji: '🏋️' },
      { name: 'Healthcare', stamps: 5, emoji: '🏥' }
    ]

    for (const template of templates) {
      // Reset to mode selection
      await page.goto('/admin/cards/new')
      
      // Enter Quick Start and select template
      await page.getByText('Quick Start').first().click()
      await page.getByText(template.name).first().click()
      await page.getByText('Next').click()
      
      // Check default stamps required
      await expect(page.getByText(`Stamps Required: ${template.stamps}`)).toBeVisible()
      
      // Select business and continue to preview
      await page.getByRole('combobox').first().click()
      await page.getByText('Test Coffee Shop').click()
      await page.getByText('Next').click()
      
      // Should show template name in summary
      await expect(page.getByText(template.name)).toBeVisible()
    }
  })
})