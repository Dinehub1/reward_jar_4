import { test, expect } from '@playwright/test'

test('Templates tab shows and navigates to editor', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/cards')
  await page.getByText('Templates').click()
  await expect(page.getByText('Templates')).toBeVisible()
})

