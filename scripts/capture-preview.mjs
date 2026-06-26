import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../preview-screenshots')
mkdirSync(outDir, { recursive: true })

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:5174'
const pages = [
  { path: '/dashboard', name: '01-overview' },
  { path: '/dashboard/courses', name: '02-courses' },
  { path: '/dashboard/progress', name: '03-progress' },
  { path: '/dashboard/assignments', name: '04-assignments' },
  { path: '/dashboard/quizzes', name: '05-quizzes' },
  { path: '/dashboard/certificates', name: '06-certificates' },
  { path: '/dashboard/notifications', name: '07-notifications' },
  { path: '/dashboard/settings', name: '08-settings' },
]

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await page.goto(`${BASE}/login/student`)
await page.fill('#email', 'neha@example.com')
await page.fill('#password', 'demo1234')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard**', { timeout: 10000 })

for (const { path, name } of pages) {
  await page.goto(`${BASE}${path}`)
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true })
  console.log(`Captured ${name}`)
}

await browser.close()
console.log(`Done — saved to ${outDir}`)
