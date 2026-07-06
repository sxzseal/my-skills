import { test, expect } from '@playwright/test'

test.describe('Skill list filter', () => {
  test('renders skill cards from the local skills folder', async ({ page }) => {
    await page.goto('/')

    // Wait for at least one skill card
    await expect(page.locator('h1').first()).toBeVisible()
    // The repo ships with `daily-report` and `file-organizer` skills
    await expect(page.getByText(/daily-report|日报生成器/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('typing in the search box updates the URL query', async ({ page }) => {
    await page.goto('/')

    const search = page
      .getByRole('textbox', { name: /按名称|search by name/i })
      .first()
    await expect(search).toBeVisible()
    await search.fill('daily')

    // Debounced by 250ms → wait for URL change
    await page.waitForURL(/[?&]q=daily/i, { timeout: 3000 })
    expect(page.url()).toMatch(/[?&]q=daily/i)
  })
})
