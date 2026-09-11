import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const baseURL = 'http://127.0.0.1:5175'
const backendURL = 'http://127.0.0.1:8000'
const backendRoot = path.resolve(dirname, '..', 'Language Analyser backend')
const backendPython = path.join(
  backendRoot, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
)
// Dedicated, gitignored, idempotently-seeded database — never the developer's real app.db.
const backendEnv = { YAOUNDE_DATABASE_URL: 'sqlite:///./data/e2e.db' }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: [
    {
      command: `"${backendPython}" scripts/seed_e2e.py && "${backendPython}" -m uvicorn yaounde_analyzer.api.asgi:app --port 8000`,
      url: `${backendURL}/api/health/live`,
      cwd: backendRoot,
      env: backendEnv,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
})
