import { test, expect } from '@playwright/test'

test.describe('Skill upload page', () => {
  test('renders the upload form', async ({ page }) => {
    await page.goto('/upload')

    // Header + first step
    await expect(page.locator('h1')).toBeVisible()
    // Dropzone label (Chinese default locale)
    await expect(
      page.locator('input#skill-file'),
    ).toHaveAttribute('accept', '.md,.zip')

    // Submit button is disabled until token + file + preview are ready
    const submitBtn = page.getByRole('button', {
      name: /提交到 github|submit to github/i,
    })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()
  })

  test('POST /api/skills success renders confirmation', async ({ page }) => {
    // Intercept the upload before hitting the page so the fetch is captured.
    await page.route('**/api/skills', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status_code: 0,
            data: {
              commitSha: 'test-commit-1234567890',
              buildId: 'build-test',
              message: 'Add skill: e2e-test',
              skill: {
                name: 'e2e-test',
                displayName: 'E2E Test',
                description: 'x',
                version: '0.1.0',
                tags: [],
                createdAt: '2026-07-06T00:00:00Z',
                updatedAt: '2026-07-06T00:00:00Z',
                sha: 'a'.repeat(40),
                sizeBytes: 32,
                content: '# hi',
                frontmatterRaw: 'name: e2e-test',
              },
            },
          }),
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/upload')

    // Simulate a GitHub token to unlock the submit gate
    const tokenInput = page.locator('input[type="password"]').first()
    await tokenInput.fill('ghp_testtoken123456789')
    await page.getByRole('button', { name: /校验并保存|validate/i }).click()
    await expect(
      page.getByText(/token 已验证|token verified/i),
    ).toBeVisible({ timeout: 3000 })

    // Attach a fake markdown file
    const fileInput = page.locator('input#skill-file')
    await fileInput.setInputFiles({
      name: 'e2e-test.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# E2E test content\n', 'utf8'),
    })

    // Fill required fields
    await page.getByPlaceholder(/daily-report/i).fill('e2e-test')
    await page.getByPlaceholder(/日报生成器|daily report generator/i).fill('E2E Test')
    await page.getByPlaceholder(/一句话|one-liner/i).fill('e2e description')

    const submitBtn = page.getByRole('button', {
      name: /提交到 github|submit to github/i,
    })
    await expect(submitBtn).toBeEnabled({ timeout: 3000 })
    await submitBtn.click()

    // Success alert
    await expect(
      page.getByText(/已提交到 github|submitted to github/i),
    ).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/test-com/)).toBeVisible()
  })
})
