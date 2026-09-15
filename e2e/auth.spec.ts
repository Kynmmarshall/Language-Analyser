import { expect, test } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERNAME, login } from './helpers'

test('protected routes redirect to sign-in when signed out', async ({ page }) => {
  await page.goto('/corpus')
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
  await page.goto('/statistics')
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
  await page.goto('/export')
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
})

test('the grammar screen stays public without signing in', async ({ page }) => {
  await page.goto('/grammar')
  await expect(page.getByRole('heading', { name: 'Specification', exact: true })).toBeVisible()
})

test('rejects an invalid password and keeps the form usable', async ({ page }) => {
  await page.goto('/corpus')
  await page.getByLabel('Username').fill(E2E_USERNAME)
  await page.getByLabel('Password').fill('definitely-wrong')
  await page.getByTestId('login-submit').click()
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.')
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
})

test('signs in, reaches the protected screen, and signs out', async ({ page }) => {
  await login(page)
  await expect(page.getByText(E2E_USERNAME)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Statements' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
})

test('a signed-in session persists across a full page reload', async ({ page }) => {
  await login(page)
  await page.reload()
  await expect(page.getByText(E2E_USERNAME)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Statements' })).toBeVisible()
})

test('the header offers a sign-in entry point when signed out', async ({ page }) => {
  await page.goto('/')
  const signIn = page.getByTestId('header-sign-in')
  await expect(signIn).toBeVisible()

  await signIn.click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
  // The entry point is redundant once you are on the login page itself.
  await expect(signIn).toHaveCount(0)
})

test('signing in from /login lands on the corpus and swaps the header control', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill(E2E_USERNAME)
  await page.getByLabel('Password').fill(E2E_PASSWORD)
  await page.getByTestId('login-submit').click()

  await expect(page).toHaveURL(/\/corpus$/)
  await expect(page.getByRole('heading', { name: 'Statements' })).toBeVisible()
  await expect(page.getByTestId('header-sign-in')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('the header control returns to sign-in after signing out', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByTestId('header-sign-in')).toBeVisible()
})
