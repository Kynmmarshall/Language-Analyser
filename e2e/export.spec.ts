import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page)
  await page.goto('/export')
})

test('shows reproducible bundle metadata and switches privacy scope', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Reproducible bundle' })).toBeVisible()
  await expect(page.getByText('Analyzer version')).toBeVisible()
  await expect(page.getByText('Spec hash')).toBeVisible()

  await page.getByRole('radio', { name: 'All statements', exact: false }).check()
  await expect(page.getByRole('cell', { name: 'e2e-seed-001' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'e2e_collector' })).toBeVisible()

  await page.getByRole('radio', { name: 'Published only', exact: false }).check()
  await expect(page.locator('dt', { hasText: 'Scope' })).toBeVisible()
})

test('downloads a JSON and a CSV evidence bundle', async ({ page }) => {
  await page.getByRole('radio', { name: 'All statements', exact: false }).check()
  await expect(page.getByRole('cell', { name: 'e2e-seed-001' })).toBeVisible()

  const jsonDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  expect((await jsonDownload).suggestedFilename()).toBe('francanglais-evidence-all.json')

  const csvDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV' }).click()
  expect((await csvDownload).suggestedFilename()).toBe('francanglais-evidence-all.csv')
})
