import type { Page } from '@playwright/test'

export const E2E_USERNAME = 'e2e_collector'
export const E2E_PASSWORD = 'e2e-local-test-fixture-only'

export async function login(page: Page): Promise<void> {
  await page.goto('/corpus')
  await page.getByLabel('Username').fill(E2E_USERNAME)
  await page.getByLabel('Password').fill(E2E_PASSWORD)
  await page.getByTestId('login-submit').click()
  await page.getByRole('button', { name: 'Sign out' }).waitFor()
}

export function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}
