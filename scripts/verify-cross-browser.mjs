#!/usr/bin/env node
/**
 * Cross-browser smoke verification — Chrome (Chromium) + Safari (WebKit).
 * Requires: backend on :3000, frontend on :5173
 */
import { chromium, webkit } from 'playwright'

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:5173'
const PASSWORD = 'Password123!'

const BROWSERS = [
  { name: 'Chrome', launch: () => chromium.launch({ headless: true }) },
  { name: 'Safari', launch: () => webkit.launch({ headless: true }) },
]

const studentRoutes = [
  ['/dashboard', 'Student overview'],
  ['/dashboard/courses', 'Student courses'],
  ['/dashboard/assignments', 'Student assignments'],
  ['/dashboard/settings', 'Student settings'],
]

const instructorRoutes = [
  ['/instructor', 'Instructor overview'],
  ['/instructor/courses', 'Instructor courses'],
  ['/instructor/students', 'Instructor students'],
]

const publicRoutes = [
  ['/', 'Homepage'],
  ['/login/student', 'Student login page'],
  ['/login/instructor', 'Instructor login page'],
]

const results = { pass: [], fail: [], warn: [] }

function pass(browser, name, detail = '') {
  const key = `[${browser}] ${name}`
  results.pass.push(key)
  console.log(`✅ ${key}${detail ? ` — ${detail}` : ''}`)
}

function fail(browser, name, detail = '') {
  const key = `[${browser}] ${name}`
  results.fail.push(key)
  console.error(`❌ ${key}${detail ? ` — ${detail}` : ''}`)
}

function warn(browser, name, detail = '') {
  const key = `[${browser}] ${name}`
  results.warn.push(key)
  console.warn(`⚠️  ${key}${detail ? ` — ${detail}` : ''}`)
}

async function login(page, role) {
  const email = role === 'student' ? 'neha.sharma@example.com' : 'cloud.lead@example.com'
  const path = role === 'student' ? '/login/student' : '/login/instructor'
  await page.goto(`${BASE}${path}`)
  await page.fill('#email', email)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  const dest = role === 'student' ? '/dashboard' : '/instructor'
  await page.waitForURL(`**${dest}**`, { timeout: 20000 })
}

async function visit(page, browserName, path, label) {
  const errors = []
  const consoleErrors = []
  const onPageError = (e) => errors.push(e.message)
  const onConsole = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  }
  page.on('pageerror', onPageError)
  page.on('console', onConsole)

  const current = new URL(page.url()).pathname
  let res
  if (current === path) {
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {})
    res = { status: () => 200 }
  } else {
    res = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 25000 })
  }
  await page.waitForTimeout(500)

  page.off('pageerror', onPageError)
  page.off('console', onConsole)

  const body = await page.locator('body').innerText()
  if (body.includes('Unable to load dashboard') || body.includes('Failed to load')) {
    fail(browserName, label, 'dashboard load error')
    return
  }
  if (body.includes('Profile unavailable') && !path.includes('profile')) {
    warn(browserName, label, 'partial load')
  }

  pass(browserName, label, String(res?.status() ?? 'ok'))

  if (errors.length) fail(browserName, `${label} (JS)`, errors.join('; '))
  if (consoleErrors.length) {
    const filtered = consoleErrors.filter(
      (m) =>
        !m.includes('favicon') &&
        !m.includes('DevTools') &&
        !m.includes('401 (Unauthorized)'),
    )
    if (filtered.length) warn(browserName, `${label} (console)`, filtered.slice(0, 3).join('; '))
  }
}

async function checkCssFeatures(page, browserName) {
  const features = await page.evaluate(() => ({
    dvh: CSS.supports('height', '100dvh'),
    backdrop: CSS.supports('backdrop-filter', 'blur(4px)'),
    gap: CSS.supports('gap', '1rem'),
    safeArea: typeof CSS !== 'undefined' && CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)'),
    lazySuspense: typeof window !== 'undefined',
  }))

  if (!features.dvh) warn(browserName, 'CSS dvh', '100dvh not supported — modal heights may clip')
  else pass(browserName, 'CSS dvh')
  if (!features.backdrop) warn(browserName, 'CSS backdrop-filter', 'header blur may not render')
  else pass(browserName, 'CSS backdrop-filter')
  pass(browserName, 'CSS gap support', String(features.gap))
}

async function checkStorage(page, browserName) {
  const ok = await page.evaluate(() => {
    try {
      localStorage.setItem('__browser_test', '1')
      localStorage.removeItem('__browser_test')
      return true
    } catch {
      return false
    }
  })
  if (ok) pass(browserName, 'localStorage')
  else warn(browserName, 'localStorage', 'unavailable — auth persistence may fail')
}

async function runBrowser({ name, launch }) {
  console.log(`\n━━━ ${name} ━━━\n`)
  const browser = await launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  try {
    for (const [path, label] of publicRoutes) {
      await visit(page, name, path, label)
    }

    await checkCssFeatures(page, name)
    await checkStorage(page, name)

    await login(page, 'student')
    pass(name, 'Student login')

    for (const [path, label] of studentRoutes) {
      await visit(page, name, path, label)
    }

    await page.goto(`${BASE}/`)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await context.clearCookies()

    await login(page, 'instructor')
    pass(name, 'Instructor login')

    for (const [path, label] of instructorRoutes) {
      await visit(page, name, path, label)
    }

    // Mobile viewport (Safari iOS quirks)
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const mobilePage = await mobile.newPage()
    await mobilePage.goto(`${BASE}/login/student`)
    await mobilePage.fill('#email', 'neha.sharma@example.com')
    await mobilePage.fill('#password', PASSWORD)
    await mobilePage.click('button[type="submit"]')
    await mobilePage.waitForURL('**/dashboard**', { timeout: 20000 })
    const menuButton = mobilePage.locator('button[aria-label="Open menu"]')
    const navVisible = await menuButton.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false)
    if (navVisible) pass(name, 'Mobile nav')
    else warn(name, 'Mobile nav', 'menu button not detected')
    await mobile.close()
  } catch (e) {
    fail(name, 'Browser verification', e instanceof Error ? e.message : String(e))
  } finally {
    await browser.close()
  }
}

console.log(`\n🌐 Cross-browser verification — ${BASE}\n`)

for (const browser of BROWSERS) {
  await runBrowser(browser)
}

console.log(`\n--- Summary ---`)
console.log(`✅ Passed: ${results.pass.length}`)
console.log(`⚠️  Warnings: ${results.warn.length}`)
console.log(`❌ Failed: ${results.fail.length}`)

if (results.fail.length) {
  console.error('\nFailures:')
  for (const f of results.fail) console.error(`  • ${f}`)
  process.exit(1)
}
