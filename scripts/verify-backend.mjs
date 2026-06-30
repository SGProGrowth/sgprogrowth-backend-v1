#!/usr/bin/env node
/**
 * Backend API verification script (smoke + extended E2E).
 * Usage:
 *   docker compose up -d
 *   cd backend && npx prisma migrate deploy && npm run db:seed
 *   npm run start:dev   # separate terminal
 *   node scripts/verify-backend.mjs
 *
 * Optional env:
 *   API_URL=http://localhost:3000/api/v1
 *   BACKEND_LOG=/path/to/backend-terminal.log  (for verify/reset token extraction)
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const API = process.env.API_URL ?? 'http://localhost:3000/api/v1'
const PASSWORD = 'Password123!'
const BACKEND_LOG = process.env.BACKEND_LOG

const results = { pass: [], fail: [], warn: [] }
const timings = []

function pass(name, detail = '') {
  results.pass.push({ name, detail })
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.fail.push({ name, detail })
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

function warn(name, detail = '') {
  results.warn.push({ name, detail })
  console.warn(`⚠️  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function req(path, options = {}) {
  const url = `${API}${path}`
  const start = performance.now()
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  const elapsed = Math.round(performance.now() - start)
  timings.push({ path, method: options.method ?? 'GET', status: res.status, ms: elapsed })
  const body = await res.json().catch(() => ({}))
  return { res, body, status: res.status, ms: elapsed }
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

function extractTokenFromLogs(email, kind) {
  const patterns = [
    BACKEND_LOG,
    `${process.env.HOME}/.cursor/projects/Users-shravanirane-Desktop-homepage/terminals/229321.txt`,
  ].filter(Boolean)

  for (const logPath of patterns) {
    if (!existsSync(logPath)) continue
    const content = readFileSync(logPath, 'utf8')
    const needle =
      kind === 'verify'
        ? /Verify your email: \S+\/verify-email\?token=([A-Za-z0-9_-]+)/
        : /Reset your password: \S+\/reset-password\?token=([A-Za-z0-9_-]+)/

    const matches = [...content.matchAll(new RegExp(needle.source, 'g'))]
    if (matches.length) {
      return matches[matches.length - 1][1]
    }
  }
  return null
}

async function login(email, role) {
  const { status, body } = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, role }),
  })
  if (status !== 200 || !body.accessToken) {
    throw new Error(`login failed ${status}: ${JSON.stringify(body.message ?? body)}`)
  }
  return body
}

async function main() {
  console.log(`\n🔍 SG Pro Growth API verification\nAPI: ${API}\n`)

  // ── Infrastructure ──────────────────────────────────────────────
  try {
    execSync('docker ps --filter name=sgpg-postgres --format "{{.Status}}"', { stdio: 'pipe' })
    pass('Docker Postgres container running')
  } catch {
    fail('Docker Postgres container running', 'docker ps failed')
  }

  try {
    execSync('docker exec sgpg-postgres pg_isready -U sgpg -d sgpg_lms', { stdio: 'pipe' })
    pass('PostgreSQL accepting connections')
  } catch {
    fail('PostgreSQL accepting connections')
  }

  // Health
  try {
    const { status, body, ms } = await req('/health')
    if (status === 200 && body.status === 'ok') pass('Health check', `${status} (${ms}ms)`)
    else fail('Health check', `status=${status}`)
  } catch (e) {
    fail('Health check', e.message)
    console.error('\nCannot reach API. Start backend with: cd backend && npm run start:dev\n')
    printSummary()
    process.exit(1)
  }

  // ── Public catalog ──────────────────────────────────────────────
  try {
    const { status, body } = await req('/courses?page=1&pageSize=5')
    if (status === 200 && Array.isArray(body.data)) {
      pass('Course catalog', `${body.meta?.total ?? body.data.length} courses`)
    } else fail('Course catalog', `status=${status}`)
  } catch (e) {
    fail('Course catalog', e.message)
  }

  try {
    const { status, body } = await req('/courses?q=aws')
    if (status === 200 && body.data?.length >= 1) pass('Catalog search', `q=aws → ${body.data.length}`)
    else fail('Catalog search', `status=${status}`)
  } catch (e) {
    fail('Catalog search', e.message)
  }

  try {
    const { status, body } = await req('/courses?category=cloud-computing')
    if (status === 200) pass('Catalog category filter', `${body.data?.length ?? 0} results`)
    else fail('Catalog category filter', `status=${status}`)
  } catch (e) {
    fail('Catalog category filter', e.message)
  }

  try {
    const { status, body } = await req('/courses?page=1&pageSize=2')
    if (status === 200 && body.meta?.pageSize === 2) pass('Catalog pagination')
    else fail('Catalog pagination', `status=${status}`)
  } catch (e) {
    fail('Catalog pagination', e.message)
  }

  try {
    const { status } = await req('/courses?featured=true')
    if (status === 200) pass('Catalog featured=true filter')
    else fail('Catalog featured=true filter', `status=${status}`)
  } catch (e) {
    fail('Catalog featured=true filter', e.message)
  }

  try {
    const { status, body } = await req('/courses?featured=false')
    if (status === 200) pass('Catalog featured=false filter', `${body.data?.length ?? 0} results`)
    else fail('Catalog featured=false filter', `status=${status}`)
  } catch (e) {
    fail('Catalog featured=false filter', e.message)
  }

  try {
    const { status, body } = await req('/categories')
    if (status === 200 && Array.isArray(body)) pass('Categories', `${body.length} categories`)
    else fail('Categories', `status=${status}`)
  } catch (e) {
    fail('Categories', e.message)
  }

  try {
    const { status } = await req('/courses/aws-solutions-architect')
    if (status === 200) pass('Course detail (public slug)')
    else if (status === 404) warn('Course detail', 'aws-solutions-architect not found — run db:seed')
    else fail('Course detail', `status=${status}`)
  } catch (e) {
    fail('Course detail', e.message)
  }

  // ── Auth: register / verify / login failures ────────────────────
  const registerEmail = `e2e.${Date.now()}@example.com`
  try {
    const { status, body } = await req('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Test User',
        email: registerEmail,
        password: PASSWORD,
        role: 'student',
      }),
    })
    if (status === 201 && body.requiresVerification) pass('Register (student)', registerEmail)
    else if (status === 200 && body.requiresVerification) pass('Register (student)', registerEmail)
    else fail('Register (student)', `status=${status}`)
  } catch (e) {
    fail('Register (student)', e.message)
  }

  try {
    const { status } = await req('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        email: registerEmail,
        password: PASSWORD,
        role: 'student',
      }),
    })
    if (status === 409) pass('Register duplicate rejected')
    else fail('Register duplicate rejected', `expected 409 got ${status}`)
  } catch (e) {
    fail('Register duplicate rejected', e.message)
  }

  try {
    const { status } = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registerEmail, password: PASSWORD, role: 'student' }),
    })
    if (status === 401 || status === 403) pass('Unverified login blocked')
    else fail('Unverified login blocked', `expected 401/403 got ${status}`)
  } catch (e) {
    fail('Unverified login blocked', e.message)
  }

  await new Promise((r) => setTimeout(r, 300))
  const verifyToken = extractTokenFromLogs(registerEmail, 'verify')
  if (verifyToken) {
    try {
      const { status, body } = await req(`/auth/verify-email?token=${encodeURIComponent(verifyToken)}`)
      if (status === 200 && body.message) pass('Verify email')
      else fail('Verify email', `status=${status}`)
    } catch (e) {
      fail('Verify email', e.message)
    }
  } else {
    warn('Verify email', 'Could not extract token from backend logs — set BACKEND_LOG env')
  }

  try {
    const { status } = await req('/auth/verify-email?token=invalid-token')
    if (status === 400) pass('Verify email invalid token rejected')
    else fail('Verify email invalid token rejected', `expected 400 got ${status}`)
  } catch (e) {
    fail('Verify email invalid token rejected', e.message)
  }

  // Student login (seeded)
  let studentToken = ''
  let studentRefresh = ''
  try {
    const body = await login('neha.sharma@example.com', 'student')
    pass('Student login')
    studentToken = body.accessToken
    studentRefresh = body.refreshToken
  } catch (e) {
    fail('Student login', e.message)
  }

  try {
    const { status } = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'neha.sharma@example.com', password: 'wrong', role: 'student' }),
    })
    if (status === 401) pass('Invalid login rejected')
    else fail('Invalid login rejected', `expected 401 got ${status}`)
  } catch (e) {
    fail('Invalid login rejected', e.message)
  }

  if (studentToken) {
    try {
      const { status, body } = await req('/auth/me', { headers: authHeaders(studentToken) })
      if (status === 200 && body.email) pass('Auth /me', body.email)
      else fail('Auth /me', `status=${status}`)
    } catch (e) {
      fail('Auth /me', e.message)
    }
  }

  // Refresh + logout
  if (studentRefresh) {
    let newRefresh = studentRefresh
    try {
      const { status, body } = await req('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: studentRefresh }),
      })
      if (status === 200 && body.accessToken) {
        pass('Refresh token rotation')
        studentToken = body.accessToken
        newRefresh = body.refreshToken ?? studentRefresh
      } else fail('Refresh token rotation', `status=${status}`)
    } catch (e) {
      fail('Refresh token rotation', e.message)
    }

    try {
      const { status } = await req('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(studentToken) },
        body: JSON.stringify({ refreshToken: newRefresh }),
      })
      if (status === 200 || status === 201) pass('Logout')
      else fail('Logout', `status=${status}`)
    } catch (e) {
      fail('Logout', e.message)
    }

    // Re-login for remaining tests
    try {
      const body = await login('neha.sharma@example.com', 'student')
      studentToken = body.accessToken
    } catch (e) {
      fail('Re-login after logout', e.message)
    }
  }

  try {
    const { status, body } = await req('/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    })
    if (status === 200 && body.message) pass('Resend verification (generic response)')
    else fail('Resend verification', `status=${status}`)
  } catch (e) {
    fail('Resend verification', e.message)
  }

  try {
    const { status, body } = await req('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ankit.verma@example.com' }),
    })
    if (status === 200 && body.message) pass('Forgot password')
    else fail('Forgot password', `status=${status}`)
  } catch (e) {
    fail('Forgot password', e.message)
  }

  await new Promise((r) => setTimeout(r, 300))
  const resetToken = extractTokenFromLogs('ankit.verma@example.com', 'reset')
  if (resetToken) {
    try {
      const { status, body } = await req('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: 'NewPassword123!' }),
      })
      if (status === 200 && body.message) pass('Reset password')
      else fail('Reset password', `status=${status}`)

      // Restore password for other tests
      await req('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ankit.verma@example.com' }),
      })
      await new Promise((r) => setTimeout(r, 300))
      const restoreToken = extractTokenFromLogs('ankit.verma@example.com', 'reset')
      if (restoreToken) {
        await req('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: restoreToken, password: PASSWORD }),
        })
      }
    } catch (e) {
      fail('Reset password', e.message)
    }
  } else {
    warn('Reset password', 'Could not extract token from backend logs')
  }

  try {
    const { status } = await req('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'bad-token', password: 'NewPassword123!' }),
    })
    if (status === 400) pass('Reset password invalid token rejected')
    else fail('Reset password invalid token rejected', `expected 400 got ${status}`)
  } catch (e) {
    fail('Reset password invalid token rejected', e.message)
  }

  // ── Workspaces ──────────────────────────────────────────────────
  if (studentToken) {
    try {
      const { status, body } = await req('/students/me', { headers: authHeaders(studentToken) })
      if (status === 200 && body.courses) {
        pass('Student workspace', `${body.courses.length} courses`)
        if (Array.isArray(body.notifications)) {
          pass('Student in-app notifications', `${body.notifications.length} items`)
        } else {
          warn('Student in-app notifications', 'not in workspace payload')
        }
      } else fail('Student workspace', `status=${status}`)
    } catch (e) {
      fail('Student workspace', e.message)
    }

    try {
      const { status, body } = await req('/enrollments/me', { headers: authHeaders(studentToken) })
      if (status === 200 && Array.isArray(body.data)) pass('Student enrollments list')
      else fail('Student enrollments list', `status=${status}`)
    } catch (e) {
      fail('Student enrollments list', e.message)
    }

    try {
      const { status, body } = await req('/enrollments/courses/aws-solutions-architect/progress', {
        headers: authHeaders(studentToken),
      })
      if (status === 200 && typeof body.progressPct === 'number') {
        pass('Enrollment progress summary', `${body.progressPct}%`)
      } else fail('Enrollment progress summary', `status=${status}`)
    } catch (e) {
      fail('Enrollment progress summary', e.message)
    }

    try {
      const { status } = await req('/instructors/me', { headers: authHeaders(studentToken) })
      if (status === 403) pass('Role guard (student → instructor blocked)')
      else fail('Role guard', `expected 403 got ${status}`)
    } catch (e) {
      fail('Role guard', e.message)
    }
  }

  // Instructor
  let instructorToken = ''
  try {
    const body = await login('cloud.lead@example.com', 'instructor')
    pass('Instructor login')
    instructorToken = body.accessToken
  } catch (e) {
    fail('Instructor login', e.message)
  }

  if (instructorToken) {
    try {
      const { status, body } = await req('/instructors/me', { headers: authHeaders(instructorToken) })
      if (status === 200 && body.courses) {
        pass('Instructor workspace', `${body.courses.length} courses`)
        if (Array.isArray(body.notifications)) {
          pass('Instructor in-app notifications', `${body.notifications.length} items`)
        }
      } else fail('Instructor workspace', `status=${status}`)
    } catch (e) {
      fail('Instructor workspace', e.message)
    }

    try {
      const { status, body } = await req('/courses/mine', { headers: authHeaders(instructorToken) })
      if (status === 200 && Array.isArray(body.data)) pass('Instructor course list')
      else fail('Instructor course list', `status=${status}`)
    } catch (e) {
      fail('Instructor course list', e.message)
    }

    try {
      const { status } = await req('/students/me', { headers: authHeaders(instructorToken) })
      if (status === 403) pass('Role guard (instructor → student blocked)')
      else fail('Role guard (instructor → student)', `expected 403 got ${status}`)
    } catch (e) {
      fail('Role guard (instructor → student)', e.message)
    }
  }

  // ── Course CRUD + curriculum + lifecycle ──────────────────────────
  let testSlug = ''
  if (instructorToken) {
    try {
      const { status, body } = await req('/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken) },
        body: JSON.stringify({
          title: `E2E Verification Course ${Date.now()}`,
          subtitle: 'Automated test course',
          categorySlug: 'cloud-computing',
          level: 'Intermediate',
          durationHours: 10,
        }),
      })
      if ((status === 201 || status === 200) && (body.slug || body.id)) {
        testSlug = body.slug ?? body.id
        pass('Create course (draft)', testSlug)
      } else fail('Create course', `status=${status}`)
    } catch (e) {
      fail('Create course', e.message)
    }

    if (testSlug) {
      try {
        const { status, body } = await req(`/courses/${testSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken) },
          body: JSON.stringify({ description: 'Updated by E2E test', featured: true }),
        })
        if (status === 200 && body.description?.includes('E2E')) pass('Update course')
        else fail('Update course', `status=${status}`)
      } catch (e) {
        fail('Update course', e.message)
      }

      const moduleId = crypto.randomUUID()
      const lessonA = crypto.randomUUID()
      const lessonB = crypto.randomUUID()
      try {
        const { status, body } = await req(`/courses/${testSlug}/curriculum`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken) },
          body: JSON.stringify({
            modules: [
              {
                id: moduleId,
                title: 'Module 1',
                order: 0,
                lessons: [
                  { id: lessonA, title: 'Lesson A', type: 'video', durationMinutes: 15, order: 0 },
                  { id: lessonB, title: 'Lesson B', type: 'pdf', durationMinutes: 10, order: 1 },
                ],
              },
            ],
          }),
        })
        const modules = Array.isArray(body) ? body : body.modules
        if (status === 200 && modules?.length === 1) pass('Replace curriculum', '2 lessons')
        else fail('Replace curriculum', `status=${status} ${JSON.stringify(body.message ?? body)}`)
      } catch (e) {
        fail('Replace curriculum', e.message)
      }

      try {
        const { status, body } = await req(`/courses/${testSlug}/curriculum`, {
          headers: authHeaders(instructorToken),
        })
        const modules = Array.isArray(body) ? body : body.modules
        if (status === 200 && modules?.[0]?.lessons?.length === 2) pass('Get curriculum')
        else fail('Get curriculum', `status=${status}`)
      } catch (e) {
        fail('Get curriculum', e.message)
      }

      try {
        const { status } = await req(`/courses/${testSlug}/curriculum/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken) },
          body: JSON.stringify({
            moduleOrder: [moduleId],
            lessonOrder: { [moduleId]: [lessonB, lessonA] },
          }),
        })
        if (status === 200) pass('Reorder lessons')
        else fail('Reorder lessons', `status=${status}`)
      } catch (e) {
        fail('Reorder lessons', e.message)
      }

      try {
        const { status, body } = await req(`/courses/${testSlug}/publish`, {
          method: 'POST',
          headers: authHeaders(instructorToken),
        })
        if (status === 200 && body.status === 'published') pass('Publish course')
        else fail('Publish course', `status=${status} ${JSON.stringify(body)}`)
      } catch (e) {
        fail('Publish course', e.message)
      }

      try {
        const { status } = await req(`/courses/${testSlug}`, { headers: authHeaders(instructorToken) })
        if (status === 200) pass('Published course detail (owner)')
        else fail('Published course detail', `status=${status}`)
      } catch (e) {
        fail('Published course detail', e.message)
      }

      try {
        const { status, body } = await req(`/courses/${testSlug}/enrollments`, {
          headers: authHeaders(instructorToken),
        })
        if (status === 200 && Array.isArray(body.data)) pass('Course enrollments (instructor)', `${body.data.length} students`)
        else fail('Course enrollments (instructor)', `status=${status}`)
      } catch (e) {
        fail('Course enrollments (instructor)', e.message)
      }

      // Student enrollment
      if (studentToken) {
        try {
          const { status, body } = await req('/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(studentToken) },
            body: JSON.stringify({ courseSlug: testSlug }),
          })
          if (status === 201 || status === 200) pass('Enroll student', testSlug)
          else if (status === 409) pass('Enroll student (already enrolled)', testSlug)
          else fail('Enroll student', `status=${status} ${JSON.stringify(body.message ?? body)}`)
        } catch (e) {
          fail('Enroll student', e.message)
        }

        try {
          const { status, body } = await req('/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(studentToken) },
            body: JSON.stringify({ courseSlug: testSlug }),
          })
          if (status === 409) pass('Duplicate enrollment rejected')
          else fail('Duplicate enrollment rejected', `expected 409 got ${status}`)
        } catch (e) {
          fail('Duplicate enrollment rejected', e.message)
        }
      }

      try {
        const { status, body } = await req(`/courses/${testSlug}/unpublish`, {
          method: 'POST',
          headers: authHeaders(instructorToken),
        })
        if (status === 200 && body.status === 'draft') pass('Unpublish course')
        else fail('Unpublish course', `status=${status}`)
      } catch (e) {
        fail('Unpublish course', e.message)
      }

      try {
        const { status, body } = await req(`/courses/${testSlug}/publish`, {
          method: 'POST',
          headers: authHeaders(instructorToken),
        })
        if (status === 200) pass('Re-publish course')
        else fail('Re-publish course', `status=${status}`)
      } catch (e) {
        fail('Re-publish course', e.message)
      }

      try {
        const { status, body } = await req(`/courses/${testSlug}/archive`, {
          method: 'POST',
          headers: authHeaders(instructorToken),
        })
        if (status === 200 && body.status === 'archived') pass('Archive course')
        else fail('Archive course', `status=${status}`)
      } catch (e) {
        fail('Archive course', e.message)
      }

      // Create and delete draft
      try {
        const { status, body } = await req('/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken) },
          body: JSON.stringify({ title: `Draft to delete ${Date.now()}` }),
        })
        if (status === 201 || status === 200) {
          const del = await req(`/courses/${body.slug ?? body.id}`, {
            method: 'DELETE',
            headers: authHeaders(instructorToken),
          })
          if (del.status === 200) pass('Delete draft course')
          else fail('Delete draft course', `status=${del.status}`)
        } else fail('Delete draft course setup', `status=${status}`)
      } catch (e) {
        fail('Delete draft course', e.message)
      }
    }
  }

  // Unauthorized access
  try {
    const { status } = await req('/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized' }),
    })
    if (status === 401) pass('Unauthenticated create course blocked')
    else fail('Unauthenticated create course blocked', `expected 401 got ${status}`)
  } catch (e) {
    fail('Unauthenticated create course blocked', e.message)
  }

  printSummary()
  printPerformance()
  process.exit(results.fail.length > 0 ? 1 : 0)
}

function printSummary() {
  console.log('\n--- Summary ---')
  console.log(`✅ Passed: ${results.pass.length}`)
  console.log(`⚠️  Warnings: ${results.warn.length}`)
  console.log(`❌ Failed: ${results.fail.length}`)
  if (results.fail.length) {
    console.log('\nFailed tests:')
    results.fail.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`))
  }
  if (results.warn.length) {
    console.log('\nWarnings:')
    results.warn.forEach((w) => console.log(`  - ${w.name}: ${w.detail}`))
  }
}

function printPerformance() {
  if (!timings.length) return
  const sorted = [...timings].sort((a, b) => b.ms - a.ms)
  const slow = sorted.filter((t) => t.ms > 500)
  console.log('\n--- Performance ---')
  console.log(`Requests: ${timings.length}, avg ${Math.round(timings.reduce((s, t) => s + t.ms, 0) / timings.length)}ms`)
  if (slow.length) {
    console.log('Slow (>500ms):')
    slow.slice(0, 5).forEach((t) => console.log(`  ${t.method} ${t.path} → ${t.ms}ms`))
  } else {
    console.log('All requests under 500ms')
  }
}

main()
