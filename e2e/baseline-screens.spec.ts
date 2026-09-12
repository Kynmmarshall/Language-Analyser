import { test } from '@playwright/test'
import { login } from './helpers'

/**
 * Not an assertion suite. Writes paired light/dark screenshots of every screen into
 * docs/ui-baseline/ for design review and coursework evidence.
 * Run explicitly: npx playwright test e2e/baseline-screens.spec.ts --project=desktop
 */
const MODES = ['light', 'dark'] as const

// Opt-in: this writes files rather than asserting, so it stays out of normal runs.
test.skip(!process.env.CAPTURE_BASELINE, 'set CAPTURE_BASELINE=1 to capture screenshots')

for (const mode of MODES) {
  test.describe(`${mode} baseline`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => {
        window.localStorage.setItem('francanglais-theme', value)
      }, mode)
    })

    test(`analyzer with results (${mode})`, async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('Original wording').fill('Combi va au kwatt.')
      await page.getByRole('button', { name: 'Analyze statement' }).click()
      await page.getByText('Grammatically accepted').waitFor()
      await page.screenshot({ path: `docs/ui-baseline/analyzer-${mode}.png`, fullPage: true })
    })

    test(`sign-in (${mode})`, async ({ page }) => {
      await page.goto('/corpus')
      await page.getByRole('heading', { name: 'Collector sign-in' }).waitFor()
      await page.screenshot({ path: `docs/ui-baseline/login-${mode}.png`, fullPage: true })
    })

    test(`grammar (${mode})`, async ({ page }) => {
      await page.goto('/grammar')
      await page.getByRole('heading', { name: 'Specification', exact: true }).waitFor()
      await page.screenshot({ path: `docs/ui-baseline/grammar-${mode}.png`, fullPage: true })
    })

    test(`corpus and drawer (${mode})`, async ({ page }) => {
      await login(page)
      await page.getByRole('heading', { name: 'Statements' }).waitFor()
      await page.screenshot({ path: `docs/ui-baseline/corpus-${mode}.png`, fullPage: true })
      await page.getByRole('button', { name: 'New statement' }).click()
      await page.getByRole('dialog', { name: 'New statement' }).waitFor()
      await page.screenshot({ path: `docs/ui-baseline/corpus-drawer-${mode}.png` })
    })

    test(`statistics (${mode})`, async ({ page }) => {
      await login(page)
      await page.goto('/statistics')
      await page.getByRole('heading', { name: 'Corpus evidence' }).waitFor()
      await page.screenshot({ path: `docs/ui-baseline/statistics-${mode}.png`, fullPage: true })
    })

    test(`export (${mode})`, async ({ page }) => {
      await login(page)
      await page.goto('/export')
      await page.getByRole('heading', { name: 'Reproducible bundle' }).waitFor()
      await page.screenshot({ path: `docs/ui-baseline/export-${mode}.png`, fullPage: true })
    })
  })
}
