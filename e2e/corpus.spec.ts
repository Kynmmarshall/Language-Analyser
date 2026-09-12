import { expect, test } from '@playwright/test'
import { login, uniqueId } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('creates, edits, publishes, views history, and unpublishes a statement', async ({ page }) => {
  const statementId = uniqueId('e2e-corpus')

  await page.getByRole('button', { name: 'New statement' }).click()
  await page.getByLabel('Statement ID').fill(statementId)
  await page.getByLabel('Raw text').fill('Le taximan waka.')
  await page.getByLabel('Collector ID').fill('e2e-suite')
  await page.getByRole('checkbox', { name: 'fuel' }).check()
  await page.getByRole('button', { name: 'Create statement' }).click()

  const row = page.getByTestId('corpus-row').filter({ has: page.getByText(statementId, { exact: true }) })
  await expect(row).toBeVisible()
  await expect(row.getByTestId('corpus-status')).toHaveText('Unpublished')

  await row.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Raw text').fill('Le taximan waka vite.')
  await page.getByRole('button', { name: 'Save revision' }).click()
  await expect(row.getByTestId('corpus-text')).toHaveText('Le taximan waka vite.')
  await expect(row.getByTestId('corpus-revision')).toHaveText('2')

  await row.getByRole('button', { name: 'Publish' }).click()
  await expect(row.getByTestId('corpus-status')).toHaveText('Published')

  await row.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: `History: ${statementId}` })).toBeVisible()
  await expect(page.getByText('Revision 1')).toBeVisible()
  await expect(page.getByText('Revision 2')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await row.getByRole('button', { name: 'Unpublish' }).click()
  await expect(row.getByTestId('corpus-status')).toHaveText('Unpublished')
})

test('rejects creating a statement with a duplicate id', async ({ page }) => {
  const statementId = uniqueId('e2e-dup')

  async function createOnce() {
    await page.getByRole('button', { name: 'New statement' }).click()
    await page.getByLabel('Statement ID').fill(statementId)
    await page.getByLabel('Raw text').fill('Combi va au kwatt.')
    await page.getByLabel('Collector ID').fill('e2e-suite')
    await page.getByRole('button', { name: 'Create statement' }).click()
  }

  await createOnce()
  await expect(page.getByTestId('corpus-row').filter({ has: page.getByText(statementId, { exact: true }) })).toBeVisible()

  await createOnce()
  await expect(page.getByText(`already exists`, { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
})

test('filters the corpus table by search text', async ({ page }) => {
  const statementId = uniqueId('e2e-search')
  await page.getByRole('button', { name: 'New statement' }).click()
  await page.getByLabel('Statement ID').fill(statementId)
  await page.getByLabel('Raw text').fill('On go au school.')
  await page.getByLabel('Collector ID').fill('e2e-suite')
  await page.getByRole('button', { name: 'Create statement' }).click()
  await expect(page.getByTestId('corpus-row').filter({ has: page.getByText(statementId, { exact: true }) })).toBeVisible()

  await page.getByLabel('Search statements').fill(statementId)
  await expect(page.getByTestId('corpus-row')).toHaveCount(1)
  await page.getByLabel('Search statements').fill('no-such-statement-xyz')
  await expect(page.getByTestId('corpus-empty')).toBeVisible()
})
