import { expect, test } from '@playwright/test'
import { E2E_USERNAME, login, uniqueId } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('creates, edits, publishes, views history, and unpublishes a statement', async ({ page }) => {
  const text = `Le taximan waka ${uniqueId('e2e')}.`

  await page.getByRole('button', { name: 'New statement' }).click()
  await expect(page.getByTestId('drawer-statement-id')).toHaveText('Assigned on save')
  await expect(page.getByTestId('drawer-collector-id')).toHaveText(E2E_USERNAME)
  await page.getByLabel('Raw text').fill(text)
  await page.getByRole('checkbox', { name: 'fuel' }).check()
  await page.getByRole('button', { name: 'Create statement' }).click()

  const row = page.getByTestId('corpus-row').filter({ hasText: text })
  await expect(row).toBeVisible()
  await expect(row.getByTestId('corpus-status')).toHaveText('Unpublished')

  // The server assigns the id; the form never asked for one.
  const statementId = (await row.getByTestId('corpus-id').textContent())?.trim() ?? ''
  expect(statementId).toMatch(/^field-\d{3}$/)

  const editedText = `${text} Vite.`
  await row.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByTestId('drawer-statement-id')).toHaveText(statementId)
  await page.getByLabel('Raw text').fill(editedText)
  await page.getByRole('button', { name: 'Save revision' }).click()

  const editedRow = page.getByTestId('corpus-row').filter({ hasText: editedText })
  await expect(editedRow.getByTestId('corpus-revision')).toHaveText('2')

  await editedRow.getByRole('button', { name: 'Publish' }).click()
  await expect(editedRow.getByTestId('corpus-status')).toHaveText('Published')

  await editedRow.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: `History: ${statementId}` })).toBeVisible()
  await expect(page.getByText('Revision 1')).toBeVisible()
  await expect(page.getByText('Revision 2')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await editedRow.getByRole('button', { name: 'Unpublish' }).click()
  await expect(editedRow.getByTestId('corpus-status')).toHaveText('Unpublished')
})

test('assigns a fresh sequential id to every new statement', async ({ page }) => {
  async function createOnce(): Promise<string> {
    const text = `Combi va au kwatt ${uniqueId('e2e')}.`
    await page.getByRole('button', { name: 'New statement' }).click()
    await page.getByLabel('Raw text').fill(text)
    await page.getByRole('button', { name: 'Create statement' }).click()
    const row = page.getByTestId('corpus-row').filter({ hasText: text })
    await expect(row).toBeVisible()
    return (await row.getByTestId('corpus-id').textContent())?.trim() ?? ''
  }

  const first = await createOnce()
  const second = await createOnce()

  expect(first).toMatch(/^field-\d{3}$/)
  expect(second).toMatch(/^field-\d{3}$/)
  expect(second).not.toBe(first)
})

test('filters the corpus table by search text', async ({ page }) => {
  const text = `On go au school ${uniqueId('e2e')}.`
  await page.getByRole('button', { name: 'New statement' }).click()
  await page.getByLabel('Raw text').fill(text)
  await page.getByRole('button', { name: 'Create statement' }).click()
  await expect(page.getByTestId('corpus-row').filter({ hasText: text })).toBeVisible()

  await page.getByLabel('Search statements').fill(text)
  await expect(page.getByTestId('corpus-row')).toHaveCount(1)
  await page.getByLabel('Search statements').fill('no-such-statement-xyz')
  await expect(page.getByTestId('corpus-empty')).toBeVisible()
})
