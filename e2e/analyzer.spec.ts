import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('one fixed target, explicit demo provenance, real analyzer connection', async ({ page }) => {
  await expect(page).toHaveTitle('Francanglais Studio')
  await expect(page.getByRole('combobox')).toHaveCount(0)
  await expect(page.getByText('Analyzer connected')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Analyze statement' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Export input' })).toBeDisabled()
  await page.getByRole('button', { name: 'Demo example' }).click()
  await expect(page.getByText('Synthetic demo', { exact: false }).first()).toBeVisible()
  await expect(page.getByLabel('Input request JSON')).toContainText('cameroon_francanglais')
  await expect(page.getByRole('button', { name: 'Analyze statement' })).toBeEnabled()
})

test('runs a real analysis and renders the accepted grammatical result', async ({ page }) => {
  await page.getByLabel('Original wording').fill('Combi va au kwatt.')
  await page.getByRole('button', { name: 'Analyze statement' }).click()
  await expect(page.getByText('Grammatically accepted')).toBeVisible()
  await expect(page.getByText('Analysis failed')).toHaveCount(0)
  const tokens = page.getByTestId('token-item')
  await expect(tokens).toHaveCount(4)
  await expect(tokens.first()).toContainText('Combi')
  await expect(page.getByText('commuting', { exact: false })).toBeVisible()
})

test('runs a real analysis and renders a syntax rejection', async ({ page }) => {
  await page.getByLabel('Original wording').fill('Va combi.')
  await page.getByRole('button', { name: 'Analyze statement' }).click()
  await expect(page.getByText('Rejected by the grammar')).toBeVisible()
  await expect(page.getByText('Reason:', { exact: false })).toBeVisible()
})

test('runs a real analysis and reports a lexical unknown-word rejection', async ({ page }) => {
  await page.getByLabel('Original wording').fill('On go au marché.')
  await page.getByRole('button', { name: 'Analyze statement' }).click()
  await expect(page.getByText('Rejected by the grammar')).toBeVisible()
  await expect(page.getByText('lexical unknown token', { exact: false })).toBeVisible()
})

test('editing input after a result marks it stale and re-analysis clears staleness', async ({ page }) => {
  await page.getByLabel('Original wording').fill('Combi va au kwatt.')
  await page.getByRole('button', { name: 'Analyze statement' }).click()
  await expect(page.getByText('Grammatically accepted')).toBeVisible()
  await page.getByLabel('Original wording').fill('Combi va au kwatt !')
  await expect(page.getByTestId('analysis-stale')).toBeVisible()
  await page.getByRole('button', { name: 'Re-analyze' }).click()
  await expect(page.getByTestId('analysis-stale')).toHaveCount(0)
})

test('exports original Unicode text and the fixed target only', async ({ page }) => {
  const text = '  Le re\u0301seau au kwatt ! \u{1f4f1}\n'
  await page.getByLabel('Original wording').fill(text)
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export input' }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('francanglais-input.json')
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(exported).toEqual({ target_variety: 'cameroon_francanglais', text })
  // Only the UI theme preference may be persisted; statement text never is.
  expect(await page.evaluate(() => JSON.stringify(window.localStorage))).not.toContain('kwatt')
})

test('rejects a different imported language without losing the draft', async ({ page }) => {
  await page.getByLabel('Original wording').fill('Combi, on go.')
  await page.getByLabel('Import input JSON').setInputFiles({
    name: 'english.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ target_variety: 'english', text: 'Hello' })),
  })
  await expect(page.getByRole('alert')).toHaveText('Only Cameroonian Francanglais is supported.')
  await expect(page.getByLabel('Original wording')).toHaveValue('Combi, on go.')
})

test('imports a valid draft through the file control and confirms clearing', async ({ page }) => {
  const choosing = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Import input', exact: true }).click()
  await (await choosing).setFiles({
    name: 'draft.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ target_variety: 'cameroon_francanglais', text: 'Je wanda !' })),
  })
  await expect(page.getByLabel('Original wording')).toHaveValue('Je wanda !')
  await expect(page.getByText('Imported input / unverified', { exact: false }).first()).toBeVisible()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Clear statement' }).click()
  await expect(page.getByLabel('Original wording')).toHaveValue('Je wanda !')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear statement' }).click()
  await expect(page.getByLabel('Original wording')).toBeEmpty()
})

test('input limits count code points and block invalid exports', async ({ page }) => {
  await page.getByLabel('Original wording').fill('\u{1f4f1}'.repeat(2000))
  await expect(page.getByText('2000 / 2000 characters')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export input' })).toBeEnabled()
  await page.getByLabel('Original wording').fill('x'.repeat(2001))
  await expect(page.getByRole('button', { name: 'Export input' })).toBeDisabled()
  await expect(page.getByLabel('Original wording')).toHaveAttribute('aria-invalid', 'true')
})

test('layout, local assets, and accessible controls', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByRole('button', { name: 'Demo example' }).click()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('600 32px "Bricolage Grotesque"'))).toBe(true)
  const texture = await page.request.get('/francanglais-grain.png')
  expect(texture.ok()).toBe(true)
  expect(texture.headers()['content-type']).toContain('image/png')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true, animations: 'disabled' })
  expect(errors).toEqual([])
})

test('keyboard entry and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to workspace' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  expect(await page.getByTestId('workbench').evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
})
