/**
 * Captures the application screenshots referenced by Appendix C of the CS4110 report.
 *
 * Usage (from the frontend repo root, with the dev server already running on 5175):
 *   $env:REPORT_USER="<collector>"; $env:REPORT_PASS="<password>"
 *   node scripts/capture-report-screenshots.mjs
 *
 * Writes 2x-scale PNGs straight into the backend repo's docs/report/figures/.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.REPORT_BASE_URL ?? 'http://127.0.0.1:5175'
const OUT_DIR =
  process.env.REPORT_FIGURES ??
  path.resolve(here, '..', '..', 'Language Analyser backend', 'docs', 'report', 'figures')

const ACCEPTED = 'Combi va au kwatt.'
const MISSPELLED = 'Le resau ne passe pas.'

async function shot(target, name, options = {}) {
  const file = path.join(OUT_DIR, name)
  await target.screenshot({ path: file, animations: 'disabled', ...options })
  console.log(`  ${name}`)
}

async function analyze(page, text) {
  await page.getByLabel('Original wording').fill(text)
  // The button is relabelled once a previous result is on screen.
  await page.getByRole('button', { name: /Analyze statement|Re-analyze/ }).click()
  await page.getByTestId('analysis-verdict').waitFor()
  await page.waitForTimeout(600) // let the staggered token animation settle
}

/** The section wrapper is the heading's parent div; `up` climbs further for grid rows. */
function section(page, heading, up = 1) {
  let node = page.getByRole('heading', { name: heading, exact: true })
  for (let i = 0; i < up; i += 1) node = node.locator('..')
  return node
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1680, height: 1050 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  })
  // Force light theme: printed figures must match the report's light page design.
  await context.addInitScript(() => {
    window.localStorage.setItem('francanglais-theme', 'light')
  })

  const page = await context.newPage()
  console.log(`Capturing from ${BASE_URL} into ${OUT_DIR}`)

  // --- Analyser: accepted statement ----------------------------------------
  await page.goto(`${BASE_URL}/`)
  await page.getByText('Analyzer connected').waitFor()
  await analyze(page, ACCEPTED)
  await shot(page, 'shot-analyser.png', { fullPage: true })

  // --- Analyser: expanded token --------------------------------------------
  await page.getByTestId('token-item').first().getByTestId('token-toggle').click()
  await page.getByTestId('token-details').waitFor()
  await shot(page.getByTestId('token-list').locator('..'), 'shot-tokens.png')

  // --- Analyser: rejection with repair suggestions --------------------------
  await analyze(page, MISSPELLED)
  await page.getByTestId('suggest-fix').click()
  await page.getByTestId('suggestion-list').waitFor()
  await shot(page.getByTestId('analysis-result'), 'shot-rejected.png')

  // --- Grammar explorer -----------------------------------------------------
  await page.goto(`${BASE_URL}/grammar`)
  await page.getByRole('heading', { name: 'Specification', exact: true }).waitFor()
  await page.waitForTimeout(800)
  // The sticky header would otherwise cover the top of each element screenshot.
  await page.addStyleTag({ content: 'header { display: none !important; }' })

  await shot(section(page, 'Original rules', 2), 'shot-grammar-original.png')
  await shot(section(page, 'Transformation ledger'), 'shot-ledger.png')
  await shot(section(page, 'LL(1) table'), 'shot-ll1-table.png')

  await page.getByTestId('lexicon-search').fill('kwatt')
  await page.waitForTimeout(300)
  await shot(page.getByTestId('lexicon-search').locator('..'), 'shot-lexicon-search.png')

  // --- Corpus manager (needs a collector account) ---------------------------
  const user = process.env.REPORT_USER
  const pass = process.env.REPORT_PASS
  if (!user || !pass) {
    console.log('\n  skipped shot-corpus.png -- set REPORT_USER and REPORT_PASS')
  } else {
    await page.goto(`${BASE_URL}/corpus`)
    const signOut = page.getByRole('button', { name: 'Sign out' })
    if (!(await signOut.isVisible().catch(() => false))) {
      await page.getByLabel('Username').fill(user)
      await page.getByLabel('Password').fill(pass)
      await page.getByTestId('login-submit').click()
    }
    await signOut.waitFor()
    await page.getByRole('heading', { name: 'Statements' }).waitFor()
    await page.waitForTimeout(900)
    await shot(page, 'shot-corpus.png', { fullPage: true })
  }

  await browser.close()
  console.log('\nDone.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
