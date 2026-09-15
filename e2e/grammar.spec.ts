import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/grammar')
})

test('renders the lexicon, rule views, ledger, and a conflict-free LL(1) table', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Specification', exact: true })).toBeVisible()
  await expect(page.getByText('LL(1): conflict-free')).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Lexical specification' })).toBeVisible()
  await expect(page.getByText('combi', { exact: true }).first()).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Original rules' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Transformed (executable) rules' })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Transformation ledger' })).toBeVisible()
  await expect(page.getByText('left factoring', { exact: false }).first()).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Nullable' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'LL(1) table' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'NT \\ T' })).toBeVisible()
})

test('filters the lexicon table as the user types', async ({ page }) => {
  const rows = page.getByRole('region', { name: 'Lexical specification' }).getByRole('row')
  const before = await rows.count()

  await page.getByTestId('lexicon-search').fill('kwatt')
  await expect(rows).not.toHaveCount(before)
  await expect(page.getByTestId('lexicon-count')).toContainText('entries')

  // Searching without accents must still reach the accented entry.
  await page.getByTestId('lexicon-search').fill('reseau')
  await expect(page.getByText('réseau', { exact: true }).first()).toBeVisible()

  await page.getByTestId('lexicon-search').fill('zzzz-no-such-word')
  await expect(page.getByTestId('lexicon-empty')).toBeVisible()
})
