import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('renders corpus-wide acceptance, frequency, topic, and origin evidence', async ({ page }) => {
  await login(page)
  await page.goto('/statistics')

  await expect(page.getByRole('heading', { name: 'Corpus evidence' })).toBeVisible()
  await expect(page.getByText('Statements')).toBeVisible()
  await expect(page.getByText('Accepted')).toBeVisible()
  await expect(page.getByText('Rejected')).toBeVisible()
  await expect(page.getByText('Acceptance rate')).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Unknown-word review queue' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Raw word frequency' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Canonical word frequency' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Topic evidence' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Borrowing-origin annotations' })).toBeVisible()
})
