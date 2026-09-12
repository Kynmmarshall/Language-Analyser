import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']

/** Force dark before first paint, the same way index.html's FOUC script does. */
async function useDarkTheme(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('francanglais-theme', 'dark')
  })
}

/**
 * axe computes contrast against composited pixels, so an element captured mid-fade
 * (opacity < 1) reports a false colour-contrast failure. Wait for finite animations
 * to finish first; infinite ones (the loading spinner) are ignored deliberately.
 */
async function settleAnimations(page: import('@playwright/test').Page) {
  await page
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .every((animation) => animation.playState === 'finished' || animation.playState === 'idle'),
      null,
      { timeout: 5000 },
    )
    .catch(() => {})
}

async function expectNoViolations(page: import('@playwright/test').Page) {
  await expect(page.locator('html')).toHaveClass(/dark/)
  await settleAnimations(page)
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([])
}

test.describe('dark theme', () => {
  test.beforeEach(async ({ page }) => {
    await useDarkTheme(page)
  })

  test('analyzer has no accessibility violations, including analysis results', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Original wording').fill('Combi va au kwatt.')
    await page.getByRole('button', { name: 'Analyze statement' }).click()
    await expect(page.getByText('Grammatically accepted')).toBeVisible()
    await expectNoViolations(page)
  })

  test('analyzer rejection state has no accessibility violations', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Original wording').fill('On go au marché.')
    await page.getByRole('button', { name: 'Analyze statement' }).click()
    await expect(page.getByText('Rejected by the grammar')).toBeVisible()
    await expectNoViolations(page)
  })

  test('sign-in has no accessibility violations', async ({ page }) => {
    await page.goto('/corpus')
    await expect(page.getByRole('heading', { name: 'Collector sign-in' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('grammar has no accessibility violations', async ({ page }) => {
    await page.goto('/grammar')
    await expect(page.getByRole('heading', { name: 'Specification', exact: true })).toBeVisible()
    await expectNoViolations(page)
  })

  test('corpus has no accessibility violations', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: 'Statements' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('corpus drawer has no accessibility violations', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'New statement' }).click()
    await expect(page.getByRole('dialog', { name: 'New statement' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('statistics has no accessibility violations', async ({ page }) => {
    await login(page)
    await page.goto('/statistics')
    await expect(page.getByRole('heading', { name: 'Corpus evidence' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('export has no accessibility violations', async ({ page }) => {
    await login(page)
    await page.goto('/export')
    await expect(page.getByRole('heading', { name: 'Reproducible bundle' })).toBeVisible()
    await expectNoViolations(page)
  })
})
