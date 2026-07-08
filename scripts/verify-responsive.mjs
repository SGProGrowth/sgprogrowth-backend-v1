#!/usr/bin/env node
/**
 * Responsive design verification — desktop, tablet, mobile.
 * Requires: backend :3000, frontend :5173
 */
import { chromium } from 'playwright'

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:3000/api/v1'
const PASSWORD = 'Password123!'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

const PUBLIC_ROUTES = [
  ['/'],
  ['/courses'],
  ['/verify'],
  ['/login'],
  ['/login/student'],
  ['/login/instructor'],
  ['/register'],
  ['/register/student'],
  ['/register/instructor'],
  ['/check-email'],
  ['/verify-email'],
  ['/resend-verification'],
  ['/forgot-password'],
  ['/reset-password'],
  ['/does-not-exist'],
]

const STUDENT_ROUTES = [
  '/dashboard',
  '/dashboard/courses',
  '/dashboard/progress',
  '/dashboard/assignments',
  '/dashboard/quizzes',
  '/dashboard/certificates',
  '/dashboard/notifications',
  '/dashboard/settings',
  '/dashboard/calendar',
  '/dashboard/batches',
  '/dashboard/coaching',
  '/dashboard/messages',
  '/dashboard/downloads',
]

const INSTRUCTOR_ROUTES = [
  '/instructor',
  '/instructor/courses',
  '/instructor/assignments',
  '/instructor/quizzes',
  '/instructor/question-bank',
  '/instructor/batches',
  '/instructor/analytics',
  '/instructor/certificates',
  '/instructor/students',
  '/instructor/students/import',
  '/instructor/notifications',
  '/instructor/calendar',
  '/instructor/profile',
  '/instructor/settings',
  '/instructor/coaching',
  '/instructor/announcements',
  '/instructor/messages',
  '/instructor/earnings',
]

const results = { pass: 0, fail: [], warn: [] }

function pass() {
  results.pass += 1
}

function fail(key, detail) {
  results.fail.push({ key, detail })
}

function warn(key, detail) {
  results.warn.push({ key, detail })
}

async function login(page, role) {
  const email = role === 'student' ? 'neha.sharma@example.com' : 'cloud.lead@example.com'
  const path = role === 'student' ? '/login/student' : '/login/instructor'
  await page.goto(`${BASE}${path}`)
  await page.fill('#email', email)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(role === 'student' ? '**/dashboard**' : '**/instructor**', { timeout: 20000 })
  await page.waitForSelector('button[aria-label="Open menu"], aside nav, #dashboard-main', { timeout: 20000 }).catch(() => {})
}

async function getAuthHeaders(page) {
  return page.evaluate(() => {
    const token = sessionStorage.getItem('sgpg-access-token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  })
}

async function discoverDynamicRoutes(page, role) {
  const headers = await getAuthHeaders(page)
  const routes = []
  try {
    if (role === 'student') {
      const res = await fetch(`${API}/students/me`, { headers })
      const data = await res.json()
      const courseSlug = data.courses?.[0]?.id
      const quizId = data.quizzes?.[0]?.id
      if (courseSlug) routes.push(`/courses/${courseSlug}`)
      if (quizId) {
        routes.push(`/dashboard/quizzes/${quizId}/start`)
      }
    } else {
      const res = await fetch(`${API}/instructors/me`, { headers })
      const data = await res.json()
      const courseId = data.courses?.[0]?.id
      const studentId = data.students?.[0]?.id
      if (courseId) {
        routes.push(`/instructor/courses/${courseId}/edit`)
        routes.push(`/instructor/courses/${courseId}/preview`)
      }
      routes.push('/instructor/courses/new')
      if (studentId) routes.push(`/instructor/students/${studentId}`)
      const pub = await fetch(`${API}/courses?limit=1`)
      const pubData = await pub.json()
      const slug = pubData.items?.[0]?.slug ?? pubData[0]?.slug
      if (slug) routes.push(`/courses/${slug}`)
    }
  } catch {
    /* optional */
  }
  return routes
}

const AUDIT_SCRIPT = () => {
  const issues = []
  const vw = document.documentElement.clientWidth

  if (document.documentElement.scrollWidth > vw + 2) {
    issues.push({
      type: 'overflow',
      severity: 'fail',
      detail: `Page scrollWidth ${document.documentElement.scrollWidth}px exceeds viewport ${vw}px`,
    })
  }

  const bodyText = document.body?.innerText ?? ''
  if (bodyText.includes('Unable to load dashboard') || bodyText.includes('Failed to load')) {
    issues.push({ type: 'load', severity: 'fail', detail: 'Dashboard failed to load' })
  }

  const isVisible = (el) => {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth
  }

  const smallTargets = []
  document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"]').forEach((el) => {
    if (!isVisible(el)) return
    const rect = el.getBoundingClientRect()
    const tag = el.tagName.toLowerCase()
    const isInlineLink = tag === 'a' && el.closest('p, li, span, dd, dt')
    const isTab = el.getAttribute('role') === 'tab'
    const minSize = isInlineLink ? 32 : 44
    if (rect.width > 0 && rect.height > 0 && (rect.width < minSize || rect.height < minSize)) {
      const label = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || tag
      smallTargets.push(`${label} (${Math.round(rect.width)}×${Math.round(rect.height)})`)
    }
    if (isTab && rect.height >= 44) return
  })

  if (smallTargets.length > 8) {
    issues.push({ type: 'touch', severity: 'warn', detail: `${smallTargets.length} small targets: ${smallTargets.slice(0, 4).join('; ')}…` })
  } else if (smallTargets.length > 0) {
    issues.push({ type: 'touch', severity: 'warn', detail: smallTargets.slice(0, 6).join('; ') })
  }

  const clipped = []
  document.querySelectorAll('h1, h2, h3, [class*="truncate"], [class*="line-clamp"]').forEach((el) => {
    if (!isVisible(el)) return
    if (el.scrollWidth > el.clientWidth + 4 && getComputedStyle(el).overflow !== 'visible') {
      const text = el.textContent?.trim().slice(0, 50)
      if (text && text.length > 12) clipped.push(text)
    }
  })
  if (clipped.length > 5) {
    issues.push({ type: 'clip', severity: 'warn', detail: `${clipped.length} truncated headings (expected on narrow screens)` })
  }

  const tables = document.querySelectorAll('table')
  tables.forEach((table) => {
    if (!isVisible(table)) return
    const wrapper = table.closest('.table-scroll, [class*="overflow-x-auto"]')
    if (table.scrollWidth > vw && !wrapper) {
      issues.push({
        type: 'table',
        severity: 'fail',
        detail: `Table ${table.scrollWidth}px wide without horizontal scroll wrapper`,
      })
    }
  })

  const offscreenButtons = []
  document.querySelectorAll('button, a.btn-primary, a.btn-secondary').forEach((el) => {
    if (!isVisible(el)) return
    const rect = el.getBoundingClientRect()
    if (rect.right > vw + 4 && !el.closest('.table-scroll, [class*="overflow-x-auto"]')) offscreenButtons.push(el.textContent?.trim().slice(0, 30) || 'button')
  })
  if (offscreenButtons.length) {
    issues.push({ type: 'layout', severity: 'fail', detail: `Buttons clipped off-screen: ${offscreenButtons.join(', ')}` })
  }

  return issues
}

async function auditPage(page, label, viewport, path) {
  const current = new URL(page.url()).pathname
  if (current !== path) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {})
  } else {
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {})
  }
  await page.waitForTimeout(600)

  const issues = await page.evaluate(AUDIT_SCRIPT)
  const key = `[${viewport}] ${label}`

  for (const issue of issues) {
    if (issue.severity === 'fail') fail(key, `${issue.type}: ${issue.detail}`)
    else warn(key, `${issue.type}: ${issue.detail}`)
  }

  if (!issues.some((i) => i.severity === 'fail')) pass()

  if (viewport === 'mobile' && (path.startsWith('/dashboard') || path.startsWith('/instructor'))) {
    const menu = page.locator('button[aria-label="Open menu"]')
    if (await menu.isVisible().catch(() => false)) {
      await menu.click()
      const navLink = page.locator('aside nav a, aside nav button').first()
      const navOk = await navLink.isVisible().catch(() => false)
      await page.keyboard.press('Escape').catch(() => menu.click().catch(() => {}))
      if (navOk) pass()
      else warn(key, 'nav: mobile sidebar did not open')
    }
  }
}

async function runViewport(viewport, routes, role) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()

  try {
    if (role) {
      await login(page, role)
      const dynamic = await discoverDynamicRoutes(page, role)
      const allRoutes = [...routes, ...dynamic]
      for (const path of allRoutes) {
        await auditPage(page, path, viewport.name, path)
      }
    } else {
      for (const entry of routes) {
        const path = Array.isArray(entry) ? entry[0] : entry
        await auditPage(page, path, viewport.name, path)
      }
    }
  } finally {
    await browser.close()
  }
}

console.log(`\n📱 Responsive verification — ${BASE}\n`)

for (const vp of VIEWPORTS) {
  console.log(`\n── ${vp.name} (${vp.width}×${vp.height}) ──`)
  await runViewport(vp, PUBLIC_ROUTES, null)
  await runViewport(vp, STUDENT_ROUTES, 'student')
  await runViewport(vp, INSTRUCTOR_ROUTES, 'instructor')
}

console.log(`\n--- Summary ---`)
console.log(`✅ Passed checks: ${results.pass}`)
console.log(`⚠️  Warnings: ${results.warn.length}`)
console.log(`❌ Failures: ${results.fail.length}`)

if (results.fail.length) {
  console.error('\nFailures:')
  for (const f of results.fail) console.error(`  • ${f.key} — ${f.detail}`)
}

const uniqueFails = [...new Set(results.fail.map((f) => f.detail.split(':')[0]))]
if (uniqueFails.length) {
  console.error('\nIssue types:', uniqueFails.join(', '))
}

if (results.fail.length) process.exit(1)
