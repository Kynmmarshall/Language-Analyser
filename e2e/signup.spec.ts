import { expect, test } from '@playwright/test'
import { uniqueId } from './helpers'

const SIGNUP_CODE = 'e2e-signup-code'

async function fillSignup(
  page: import('@playwright/test').Page,
  values: { username: string; password: string; code: string },
) {
  await page.getByLabel('Username').fill(values.username)
  await page.getByLabel('Password').fill(values.password)
  await page.getByLabel('Team registration code').fill(values.code)
}

test('creates an account with the team code and lands signed in', async ({ page }) => {
  const username = uniqueId('signup').replace(/[^a-z0-9-]/gi, '')
  await page.goto('/signup')
  await fillSignup(page, { username, password: 'a-long-enough-password', code: SIGNUP_CODE })
  await page.getByTestId('signup-submit').click()

  await expect(page).toHaveURL(/\/corpus$/)
  await expect(page.getByRole('heading', { name: 'Statements' })).toBeVisible()
  await expect(page.getByText(username)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('rejects a wrong registration code without creating an account', async ({ page }) => {
  await page.goto('/signup')
  await fillSignup(page, {
    username: uniqueId('nope').replace(/[^a-z0-9-]/gi, ''),
    password: 'a-long-enough-password',
    code: 'wrong-code',
  })
  await page.getByTestId('signup-submit').click()

  await expect(page.getByRole('alert')).toContainText('registration code')
  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0)
})

test('rejects a username that is already taken', async ({ page }) => {
  await page.goto('/signup')
  await fillSignup(page, {
    username: 'e2e_collector',
    password: 'a-long-enough-password',
    code: SIGNUP_CODE,
  })
  await page.getByTestId('signup-submit').click()
  await expect(page.getByRole('alert')).toContainText('already taken')
})

test('login and signup link to each other when signup is enabled', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('switch-to-signup').click()
  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()

  await page.getByTestId('switch-to-login').click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
})
