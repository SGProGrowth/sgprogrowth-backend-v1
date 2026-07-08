#!/usr/bin/env node
/**
 * Frontend smoke verification — login + route accessibility.
 *
 * Usage (from repo root):
 *   docker compose up -d
 *   cd backend && npx prisma migrate deploy && npm run db:seed && npm run start:dev
 *   npm run dev                          # separate terminal
 *   npm run verify:frontend
 *
 * Optional env: PREVIEW_URL=http://localhost:5173
 */
import { chromium } from 'playwright'

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'

const results = { pass: [], fail: [], warn: [] }

function pass(name, detail = '') {
  results.pass.push(name)
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}
function fail(name, detail = '') {
  results.fail.push(name)
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}
function warn(name, detail = '') {
  results.warn.push(name)
  console.warn(`⚠️  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function login(page, role) {
  const email = role === 'student' ? 'neha.sharma@example.com' : 'cloud.lead@example.com'
  const path = role === 'student' ? '/login/student' : '/login/instructor'
  await page.goto(`${BASE}${path}`)
  await page.fill('#email', email)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  const dest = role === 'student' ? '/dashboard' : '/instructor'
  await page.waitForURL(`**${dest}**`, { timeout: 15000 })
}

async function visit(page, path, label, expectText) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const res = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(400)
  const body = await page.locator('body').innerText()
  if (body.includes('Unable to load dashboard') || body.includes('Failed to load')) {
    fail(label, 'dashboard load error')
    return
  }
  if (body.includes('Profile unavailable') && !path.includes('profile')) {
    warn(label, 'partial load')
  }
  if (expectText && !body.includes(expectText)) {
    warn(label, `expected text "${expectText}" not found`)
  } else {
    pass(label, res?.status()?.toString() ?? 'ok')
  }
  if (errors.length) warn(label, `JS errors: ${errors.join('; ')}`)
}

const studentRoutes = [
  ['/dashboard', 'Student overview'],
  ['/dashboard/courses', 'Student courses'],
  ['/dashboard/progress', 'Student progress'],
  ['/dashboard/assignments', 'Student assignments'],
  ['/dashboard/quizzes', 'Student quizzes'],
  ['/dashboard/certificates', 'Student certificates'],
  ['/dashboard/notifications', 'Student notifications'],
  ['/dashboard/settings', 'Student settings'],
  ['/dashboard/calendar', 'Student calendar'],
  ['/dashboard/batches', 'Student batches'],
]

const instructorRoutes = [
  ['/instructor', 'Instructor overview'],
  ['/instructor/courses', 'Instructor courses'],
  ['/instructor/assignments', 'Instructor assignments'],
  ['/instructor/quizzes', 'Instructor quizzes'],
  ['/instructor/question-bank', 'Question bank'],
  ['/instructor/batches', 'Instructor batches'],
  ['/instructor/analytics', 'Instructor analytics'],
  ['/instructor/certificates', 'Instructor certificates'],
  ['/instructor/students', 'Instructor students'],
  ['/instructor/students/import', 'Bulk import'],
]

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

try {
  console.log(`\n🌐 Frontend verification — ${BASE}\n`)

  await login(page, 'student')
  pass('Student login')

  for (const [path, label] of studentRoutes) {
    await visit(page, path, label)
  }

  await page.goto(`${BASE}/`)
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.context().clearCookies()
  await login(page, 'instructor')
  pass('Instructor login')

  for (const [path, label] of instructorRoutes) {
    await visit(page, path, label)
  }

  // Responsive spot-check (student dashboard)
  for (const vp of viewports) {
    const vpPage = await browser.newPage()
    await vpPage.setViewportSize({ width: vp.width, height: vp.height })
    await vpPage.goto(`${BASE}/login/student`)
    await vpPage.fill('#email', 'neha.sharma@example.com')
    await vpPage.fill('#password', PASSWORD)
    await vpPage.click('button[type="submit"]')
    await vpPage.waitForURL('**/dashboard**', { timeout: 15000 })
    const navVisible = await vpPage.locator('nav, aside, [class*="sidebar"]').first().isVisible().catch(() => false)
    if (navVisible) pass(`Responsive nav (${vp.name})`)
    else warn(`Responsive nav (${vp.name})`, 'sidebar not detected')
    await vpPage.close()
  }
} catch (e) {
  fail('Frontend verification', e instanceof Error ? e.message : String(e))
} finally {
  await browser.close()
}

console.log(`\n--- Summary ---`)
console.log(`✅ Passed: ${results.pass.length}`)
console.log(`⚠️  Warnings: ${results.warn.length}`)
console.log(`❌ Failed: ${results.fail.length}`)
if (results.fail.length) process.exit(1)
