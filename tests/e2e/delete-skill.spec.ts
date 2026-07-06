import { test, expect } from '@playwright/test'

test.describe('Skill detail · delete flow', () => {
  test('renders detail page for the shipped daily-report skill', async ({
    page,
  }) => {
    await page.goto('/skills/daily-report')
    await expect(page.locator('h1')).toBeVisible()
    // 删除 button appears on the detail toolbar
    await expect(page.getByRole('button', { name: /删除|delete/i })).toBeVisible()
  })

  test('mocked DELETE opens confirm modal and navigates back to list on confirm', async ({
    page,
  }) => {
    await page.route('**/api/skills/daily-report', async (route, request) => {
      if (request.method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status_code: 0,
            data: { commitSha: 'deleted-commit-abcdef' },
          }),
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/skills/daily-report')

    // Click the delete button in the toolbar (not inside the modal yet)
    await page
      .getByRole('button', { name: /^\s*(删除|delete)\s*$/i })
      .first()
      .click()

    // Confirm modal appears
    await expect(page.getByRole('dialog')).toBeVisible()

    // Confirm within modal
    await page.getByRole('button', { name: /确认删除|^delete$/i }).click()

    // Should navigate away from the detail page
    await page.waitForURL((url) => !url.pathname.includes('/skills/daily-report'), {
      timeout: 5000,
    })
    expect(page.url()).not.toContain('/skills/daily-report')
  })
})
