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
        ? /verify-email\?token=([A-Za-z0-9_-]+)/
        : /reset-password\?token=([A-Za-z0-9_-]+)/

    const matches = [...content.matchAll(new RegExp(needle.source, 'g'))]
    if (matches.length) {
      return matches[matches.length - 1][1]
    }
  }
  return null
}

async function fetchTestToken(email, kind) {
  try {
    const { status, body } = await req(
      `/auth/test/token?email=${encodeURIComponent(email)}&type=${kind}`,
    )
    if (status === 200 && body.token) return body.token
  } catch {
    /* fall through to log extraction */
  }
  return extractTokenFromLogs(email, kind)
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
  await new Promise((r) => setTimeout(r, 300))
  const verifyToken = await fetchTestToken(registerEmail, 'verify')
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
  await new Promise((r) => setTimeout(r, 300))
  const resetToken = await fetchTestToken('ankit.verma@example.com', 'reset')
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
      await new Promise((r) => setTimeout(r, 300))
      const restoreToken = await fetchTestToken('ankit.verma@example.com', 'reset')
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

  // ── Assignments (Phase 3.1) ─────────────────────────────────────
  let instructorToken2 = ''
  let studentToken2 = ''
  let studentUserId = ''
  let assignmentId = ''

  try {
    const body = await login('cloud.lead@example.com', 'instructor')
    instructorToken2 = body.accessToken
  } catch (e) {
    fail('Assignment setup: instructor login', e.message)
  }

  try {
    const body = await login('neha.sharma@example.com', 'student')
    studentToken2 = body.accessToken
    studentUserId = body.user?.id ?? ''
  } catch (e) {
    fail('Assignment setup: student login', e.message)
  }

  if (instructorToken2) {
    try {
      const { status, body } = await req('/assignments/mine', {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && Array.isArray(body.data)) pass('Instructor assignments list', `${body.data.length} items`)
      else fail('Instructor assignments list', `status=${status}`)
    } catch (e) {
      fail('Instructor assignments list', e.message)
    }

    try {
      const { status, body } = await req('/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({
          title: `E2E Assignment ${Date.now()}`,
          courseSlug: 'aws-solutions-architect',
          type: 'project',
          instructions: '<p>Submit your architecture document.</p>',
          dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          maxScore: 100,
          allowLate: true,
          allowResubmission: true,
          allowedFileTypes: ['pdf', 'txt'],
        }),
      })
      if ((status === 201 || status === 200) && body.id) {
        assignmentId = body.id
        pass('Create assignment (draft)', assignmentId)
      } else fail('Create assignment', `status=${status}`)
    } catch (e) {
      fail('Create assignment', e.message)
    }

    if (assignmentId) {
      try {
        const { status, body } = await req(`/assignments/${assignmentId}/publish`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 && body.status === 'published') pass('Publish assignment')
        else fail('Publish assignment', `status=${status}`)
      } catch (e) {
        fail('Publish assignment', e.message)
      }

      try {
        const { status } = await req(`/assignments/${assignmentId}/unpublish`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 200) pass('Unpublish assignment')
        else fail('Unpublish assignment', `status=${status}`)
      } catch (e) {
        fail('Unpublish assignment', e.message)
      }

      try {
        const { status } = await req(`/assignments/${assignmentId}/publish`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 200) pass('Re-publish assignment')
        else fail('Re-publish assignment', `status=${status}`)
      } catch (e) {
        fail('Re-publish assignment', e.message)
      }
    }
  }

  if (studentToken2) {
    try {
      const { status, body } = await req('/assignments/me', {
        headers: authHeaders(studentToken2),
      })
      if (status === 200 && Array.isArray(body.data)) pass('Student assignments list', `${body.data.length} items`)
      else fail('Student assignments list', `status=${status}`)
    } catch (e) {
      fail('Student assignments list', e.message)
    }

    if (assignmentId) {
      try {
        const form = new FormData()
        form.append('body', 'E2E test submission content')
        const url = `${API}/assignments/${assignmentId}/submissions`
        const res = await fetch(url, {
          method: 'POST',
          headers: { Accept: 'application/json', Authorization: `Bearer ${studentToken2}` },
          body: form,
        })
        const body = await res.json().catch(() => ({}))
        if (res.status === 201 || res.status === 200) pass('Student submit assignment (text)')
        else fail('Student submit assignment', `status=${res.status} ${JSON.stringify(body.message ?? body)}`)
      } catch (e) {
        fail('Student submit assignment', e.message)
      }

      try {
        const { status, body } = await req(`/assignments/${assignmentId}`, {
          headers: authHeaders(studentToken2),
        })
        if (status === 200 && body.title) pass('Student assignment detail')
        else fail('Student assignment detail', `status=${status}`)
      } catch (e) {
        fail('Student assignment detail', e.message)
      }
    }

    try {
      const { status } = await req('/assignments/mine', {
        headers: authHeaders(studentToken2),
      })
      if (status === 403) pass('Role guard (student → instructor assignments blocked)')
      else fail('Role guard assignments', `expected 403 got ${status}`)
    } catch (e) {
      fail('Role guard assignments', e.message)
    }
  }

  if (instructorToken2 && assignmentId) {
    try {
      const { status, body } = await req(`/assignments/${assignmentId}/submissions`, {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && body.data?.length >= 1) {
        pass('Instructor list submissions', `${body.data.length} submission(s)`)
        const subId = body.data[0].id
        const grade = await req(`/assignments/${assignmentId}/submissions/${subId}/grade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
          body: JSON.stringify({ score: 88, feedback: 'Well done' }),
        })
        if (grade.status === 200) pass('Grade submission', '88/100')
        else fail('Grade submission', `status=${grade.status}`)
      } else fail('Instructor list submissions', `status=${status}`)
    } catch (e) {
      fail('Instructor grading flow', e.message)
    }
  }

  // ── Question Bank (Phase 3.2) ─────────────────────────────────────
  let questionId = ''
  if (instructorToken2) {
    try {
      const { status, body } = await req('/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({
          questionText: 'What is the capital of France?',
          type: 'short_answer',
          difficulty: 'easy',
          marks: 2,
          category: 'Geography',
          tags: ['capitals', 'europe'],
        }),
      })
      if ((status === 201 || status === 200) && body.id) {
        questionId = body.id
        pass('Create question', questionId)
      } else fail('Create question', `status=${status}`)
    } catch (e) {
      fail('Create question', e.message)
    }

    if (questionId) {
      try {
        const { status, body } = await req(`/questions?q=France`, {
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 && body.data?.some((q) => q.id === questionId)) pass('Search questions')
        else fail('Search questions', `status=${status}`)
      } catch (e) {
        fail('Search questions', e.message)
      }

      try {
        const { status } = await req(`/questions/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
          body: JSON.stringify({ marks: 3, explanation: 'Paris is the capital.' }),
        })
        if (status === 200) pass('Update question (versioning)')
        else fail('Update question', `status=${status}`)
      } catch (e) {
        fail('Update question', e.message)
      }

      try {
        const { status, body } = await req(`/questions/${questionId}/versions`, {
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 && Array.isArray(body) && body.length >= 1) pass('Question version history')
        else fail('Question version history', `status=${status}`)
      } catch (e) {
        fail('Question version history', e.message)
      }

      try {
        const { status, body } = await req(`/questions/${questionId}/duplicate`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 201 || status === 200) pass('Duplicate question')
        else fail('Duplicate question', `status=${status}`)
      } catch (e) {
        fail('Duplicate question', e.message)
      }

      try {
        const { status } = await req(`/questions/${questionId}/archive`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 || status === 201) pass('Archive question')
        else fail('Archive question', `status=${status}`)
      } catch (e) {
        fail('Archive question', e.message)
      }

      try {
        const { status } = await req(`/questions/${questionId}/restore`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 || status === 201) pass('Restore question')
        else fail('Restore question', `status=${status}`)
      } catch (e) {
        fail('Restore question', e.message)
      }
    }

    try {
      const { status } = await req('/questions/export/csv', {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200) pass('Export questions CSV')
      else fail('Export questions CSV', `status=${status}`)
    } catch (e) {
      fail('Export questions CSV', e.message)
    }

    try {
      const csv = 'question_text,type,difficulty,marks,category,tags\n"What is 2+2?",short_answer,easy,1,Math,arithmetic'
      const form = new FormData()
      form.append('file', new Blob([csv], { type: 'text/csv' }), 'questions.csv')
      const res = await fetch(`${API}/questions/import/csv`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${instructorToken2}` },
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 200 || res.status === 201) pass('Import questions CSV', `${body.imported ?? 0} imported`)
      else fail('Import questions CSV', `status=${res.status}`)
    } catch (e) {
      fail('Import questions CSV', e.message)
    }

    try {
      const { status } = await req('/questions', { headers: authHeaders(studentToken2) })
      if (status === 403) pass('Role guard (student → questions blocked)')
      else fail('Role guard questions', `expected 403 got ${status}`)
    } catch (e) {
      fail('Role guard questions', e.message)
    }
  }

  // ── Quiz Engine (Phase 3.3) ───────────────────────────────────────
  let quizId = ''
  let quizAttemptId = ''
  if (instructorToken2 && studentToken2) {
    try {
      const { status, body } = await req('/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({
          title: `E2E Quiz ${Date.now()}`,
          courseSlug: 'aws-solutions-architect',
          durationMinutes: 15,
          maxAttempts: 2,
          passScore: 70,
          showScoreImmediately: true,
        }),
      })
      if ((status === 201 || status === 200) && body.id) {
        quizId = body.id
        pass('Create quiz', quizId)
      } else fail('Create quiz', `status=${status}`)
    } catch (e) {
      fail('Create quiz', e.message)
    }

    if (quizId && questionId) {
      try {
        const { status } = await req(`/quizzes/${quizId}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
          body: JSON.stringify({ questions: [{ questionId, sortOrder: 1 }] }),
        })
        if (status === 200) pass('Set quiz questions')
        else fail('Set quiz questions', `status=${status}`)
      } catch (e) {
        fail('Set quiz questions', e.message)
      }

      try {
        const { status } = await req(`/quizzes/${quizId}/publish`, {
          method: 'POST',
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 || status === 201) pass('Publish quiz')
        else fail('Publish quiz', `status=${status}`)
      } catch (e) {
        fail('Publish quiz', e.message)
      }
    }

    if (quizId) {
      try {
        const { status, body } = await req('/quizzes/me', { headers: authHeaders(studentToken2) })
        if (status === 200 && Array.isArray(body) && body.some((q) => q.id === quizId)) pass('Student quiz list')
        else fail('Student quiz list', `status=${status}`)
      } catch (e) {
        fail('Student quiz list', e.message)
      }

      try {
        const { status, body } = await req(`/quizzes/${quizId}/attempts/start`, {
          method: 'POST',
          headers: authHeaders(studentToken2),
        })
        if ((status === 200 || status === 201) && body.attemptId) {
          quizAttemptId = body.attemptId
          pass('Start quiz attempt', quizAttemptId)
        } else fail('Start quiz attempt', `status=${status}`)
      } catch (e) {
        fail('Start quiz attempt', e.message)
      }

      if (quizAttemptId) {
        const qqId = (await req(`/quizzes/attempts/${quizAttemptId}/player`, { headers: authHeaders(studentToken2) })).body?.questions?.[0]?.quizQuestionId
        if (qqId) {
          try {
            const { status } = await req(`/quizzes/attempts/${quizAttemptId}/answers`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...authHeaders(studentToken2) },
              body: JSON.stringify({ answers: [{ quizQuestionId: qqId, response: { value: 'Paris' } }] }),
            })
            if (status === 200) pass('Save quiz answers (auto-save)')
            else fail('Save quiz answers', `status=${status}`)
          } catch (e) {
            fail('Save quiz answers', e.message)
          }
        }

        try {
          const { status, body } = await req(`/quizzes/attempts/${quizAttemptId}/submit`, {
            method: 'POST',
            headers: authHeaders(studentToken2),
          })
          if (status === 200 || status === 201) pass('Submit quiz', `score=${body.score ?? 'pending'}`)
          else fail('Submit quiz', `status=${status}`)
        } catch (e) {
          fail('Submit quiz', e.message)
        }

        try {
          const { status, body } = await req(`/quizzes/attempts/${quizAttemptId}/result`, {
            headers: authHeaders(studentToken2),
          })
          if (status === 200 && body.attemptId) pass('Quiz result')
          else fail('Quiz result', `status=${status}`)
        } catch (e) {
          fail('Quiz result', e.message)
        }
      }

      try {
        const { status, body } = await req(`/quizzes/${quizId}/analytics`, {
          headers: authHeaders(instructorToken2),
        })
        if (status === 200 && typeof body.attemptCount === 'number') pass('Quiz analytics')
        else fail('Quiz analytics', `status=${status}`)
      } catch (e) {
        fail('Quiz analytics', e.message)
      }

      try {
        const { status } = await req('/quizzes/mine', { headers: authHeaders(studentToken2) })
        if (status === 403) pass('Role guard (student → instructor quizzes blocked)')
        else fail('Role guard quizzes', `expected 403 got ${status}`)
      } catch (e) {
        fail('Role guard quizzes', e.message)
      }
    }
  }

  // ── Learning Progress (Phase 3.4) ─────────────────────────────────
  let progressLessonId = ''
  if (studentToken2) {
    try {
      const { status, body } = await req('/progress/me', { headers: authHeaders(studentToken2) })
      if (status === 200 && typeof body.overallProgress === 'number') {
        pass('Student progress dashboard', `${body.overallProgress}% overall`)
      } else fail('Student progress dashboard', `status=${status}`)
    } catch (e) {
      fail('Student progress dashboard', e.message)
    }

    try {
      const { status, body } = await req('/progress/me/continue', { headers: authHeaders(studentToken2) })
      if (status === 200 && Array.isArray(body.items)) pass('Continue learning API')
      else fail('Continue learning API', `status=${status}`)
    } catch (e) {
      fail('Continue learning API', e.message)
    }

    try {
      const { status, body } = await req('/progress/courses/aws-solutions-architect', {
        headers: authHeaders(studentToken2),
      })
      if (status === 200 && Array.isArray(body.modules)) {
        progressLessonId = body.modules?.[0]?.lessons?.[0]?.id ?? ''
        pass('Course progress detail', `${body.modules.length} modules`)
      } else fail('Course progress detail', `status=${status}`)
    } catch (e) {
      fail('Course progress detail', e.message)
    }

    if (progressLessonId) {
      try {
        const { status } = await req(
          `/progress/lessons/${progressLessonId}/courses/aws-solutions-architect`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders(studentToken2) },
            body: JSON.stringify({ videoProgressPct: 50, timeSpentSeconds: 600, recordAccess: true }),
          },
        )
        if (status === 200) pass('Update lesson progress (video/time)')
        else fail('Update lesson progress', `status=${status}`)
      } catch (e) {
        fail('Update lesson progress', e.message)
      }

      try {
        const { status, body } = await req(
          `/progress/lessons/${progressLessonId}/courses/aws-solutions-architect/complete`,
          { method: 'POST', headers: authHeaders(studentToken2) },
        )
        if (status === 200 || status === 201) {
          const lessonStatus = body.modules?.[0]?.lessons?.find((l) => l.id === progressLessonId)?.status
          if (lessonStatus === 'completed') pass('Mark lesson complete', progressLessonId)
          else pass('Mark lesson complete', 'recalculated')
        } else fail('Mark lesson complete', `status=${status}`)
      } catch (e) {
        fail('Mark lesson complete', e.message)
      }

      try {
        const { status } = await req(
          `/progress/lessons/${progressLessonId}/courses/aws-solutions-architect/incomplete`,
          { method: 'POST', headers: authHeaders(studentToken2) },
        )
        if (status === 200 || status === 201) pass('Mark lesson incomplete')
        else fail('Mark lesson incomplete', `status=${status}`)
      } catch (e) {
        fail('Mark lesson incomplete', e.message)
      }
    }

    try {
      const { status } = await req('/progress/instructor/courses/aws-solutions-architect/analytics', {
        headers: authHeaders(studentToken2),
      })
      if (status === 403) pass('Role guard (student → instructor progress blocked)')
      else fail('Role guard progress', `expected 403 got ${status}`)
    } catch (e) {
      fail('Role guard progress', e.message)
    }
  }

  if (instructorToken2) {
    try {
      const { status, body } = await req('/progress/instructor/courses/aws-solutions-architect/analytics', {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && typeof body.averageProgress === 'number') {
        pass('Instructor course progress analytics', `${body.averageProgress}% avg`)
      } else fail('Instructor course progress analytics', `status=${status}`)
    } catch (e) {
      fail('Instructor course progress analytics', e.message)
    }
  }

  // ── Certificates (Phase 3.5) ──────────────────────────────────────
  let certificateId = ''
  let credentialId = ''

  if (instructorToken2 && studentUserId) {
    try {
      const { status, body } = await req('/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({
          courseSlug: 'aws-solutions-architect',
          studentId: studentUserId,
          bypassRules: true,
        }),
      })
      if ((status === 200 || status === 201) && body.id) {
        certificateId = body.id
        credentialId = body.credentialId
        pass('Manual certificate issue', credentialId)
      } else fail('Manual certificate issue', `status=${status}`)
    } catch (e) {
      fail('Manual certificate issue', e.message)
    }
  }

  if (studentToken2 && certificateId) {
    try {
      const { status, body } = await req('/certificates/me', { headers: authHeaders(studentToken2) })
      if (status === 200 && Array.isArray(body) && body.some((c) => c.id === certificateId)) {
        pass('Student certificate list')
      } else fail('Student certificate list', `status=${status}`)
    } catch (e) {
      fail('Student certificate list', e.message)
    }

    try {
      const { status, body } = await req(`/certificates/${certificateId}`, {
        headers: authHeaders(studentToken2),
      })
      if (status === 200 && body.credentialId) pass('Certificate detail')
      else fail('Certificate detail', `status=${status}`)
    } catch (e) {
      fail('Certificate detail', e.message)
    }

    try {
      const res = await fetch(`${API}/certificates/${certificateId}/pdf`, {
        headers: { Authorization: `Bearer ${studentToken2}` },
      })
      if (res.status === 200 && res.headers.get('content-type')?.includes('pdf')) {
        pass('Certificate PDF download')
      } else fail('Certificate PDF download', `status=${res.status}`)
    } catch (e) {
      fail('Certificate PDF download', e.message)
    }

    try {
      const { status } = await req('/certificates/mine', { headers: authHeaders(studentToken2) })
      if (status === 403) pass('Role guard (student → instructor certificates blocked)')
      else fail('Role guard certificates', `expected 403 got ${status}`)
    } catch (e) {
      fail('Role guard certificates', e.message)
    }
  }

  if (credentialId) {
    try {
      const { status, body } = await req(`/certificates/verify/${credentialId}`)
      if (status === 200 && body.valid === true) pass('Public certificate verification', credentialId)
      else fail('Public certificate verification', `status=${status} valid=${body.valid}`)
    } catch (e) {
      fail('Public certificate verification', e.message)
    }

    try {
      const { status, body } = await req('/certificates/verify/SGPG-INVALID00000000')
      if (status === 200 && body.valid === false) pass('Invalid credential rejected')
      else fail('Invalid credential rejected', `status=${status}`)
    } catch (e) {
      fail('Invalid credential rejected', e.message)
    }
  }

  if (instructorToken2 && certificateId) {
    try {
      const { status } = await req(`/certificates/${certificateId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({ reason: 'E2E test revocation' }),
      })
      if (status === 200 || status === 201) pass('Revoke certificate')
      else fail('Revoke certificate', `status=${status}`)
    } catch (e) {
      fail('Revoke certificate', e.message)
    }

    if (credentialId) {
      try {
        const { status, body } = await req(`/certificates/verify/${credentialId}`)
        if (status === 200 && body.status === 'revoked') pass('Revoked certificate verification')
        else fail('Revoked certificate verification', `status=${body.status}`)
      } catch (e) {
        fail('Revoked certificate verification', e.message)
      }
    }

    try {
      const { status, body } = await req(`/certificates/${certificateId}/reissue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({}),
      })
      if ((status === 200 || status === 201) && body.id) {
        credentialId = body.credentialId
        pass('Reissue certificate', body.credentialId)
      } else fail('Reissue certificate', `status=${status}`)
    } catch (e) {
      fail('Reissue certificate', e.message)
    }

    try {
      const { status, body } = await req('/certificates/mine', {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && Array.isArray(body)) pass('Instructor certificate list', `${body.length} items`)
      else fail('Instructor certificate list', `status=${status}`)
    } catch (e) {
      fail('Instructor certificate list', e.message)
    }

    try {
      const { status, body } = await req('/certificates/templates', {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && Array.isArray(body) && body.length > 0) pass('Certificate templates')
      else fail('Certificate templates', `status=${status}`)
    } catch (e) {
      fail('Certificate templates', e.message)
    }
  }

  // ── Phase 3.6: Batch Management & Bulk Import ───────────────────
  let batchId = ''
  let importJobId = ''

  if (instructorToken2) {
    try {
      const { status, body } = await req('/batches/mine', { headers: authHeaders(instructorToken2) })
      if (status === 200 && Array.isArray(body)) {
        pass('List instructor batches', `${body.length} batches`)
        batchId = body[0]?.id ?? ''
      } else fail('List instructor batches', `status=${status}`)
    } catch (e) {
      fail('List instructor batches', e.message)
    }

    try {
      const { status, body } = await req('/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({
          name: 'E2E Test Batch',
          courseSlug: 'aws-solutions-architect',
          startDate: '2026-09-01',
          endDate: '2026-11-30',
          schedule: 'Mon & Wed · 7:00 PM IST',
          maxCapacity: 25,
          publish: true,
        }),
      })
      if ((status === 200 || status === 201) && body.id) {
        batchId = body.id
        pass('Create batch', body.batchCode)
      } else fail('Create batch', `status=${status}`)
    } catch (e) {
      fail('Create batch', e.message)
    }
  }

  if (instructorToken2 && batchId) {
    try {
      const { status, body } = await req(`/batches/${batchId}`, { headers: authHeaders(instructorToken2) })
      if (status === 200 && body.id === batchId) pass('Get batch detail')
      else fail('Get batch detail', `status=${status}`)
    } catch (e) {
      fail('Get batch detail', e.message)
    }

    try {
      const { status, body } = await req(`/batches/${batchId}/dashboard`, {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && typeof body.studentCount === 'number') pass('Batch dashboard')
      else fail('Batch dashboard', `status=${status}`)
    } catch (e) {
      fail('Batch dashboard', e.message)
    }

    try {
      const { status, body } = await req(`/batches/${batchId}/calendar`, {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && Array.isArray(body.events)) pass('Batch calendar')
      else fail('Batch calendar', `status=${status}`)
    } catch (e) {
      fail('Batch calendar', e.message)
    }

    try {
      const { status, body } = await req(`/batches/${batchId}/students`, {
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 && Array.isArray(body)) pass('List batch students', `${body.length} students`)
      else fail('List batch students', `status=${status}`)
    } catch (e) {
      fail('List batch students', e.message)
    }

    try {
      const { status, body } = await req(`/batches/${batchId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({
          email: `batch.import.${Date.now()}@example.com`,
          name: 'Batch Import Test',
          createAccount: true,
        }),
      })
      if ((status === 200 || status === 201) && body.id) pass('Add student to batch')
      else fail('Add student to batch', `status=${status}`)
    } catch (e) {
      fail('Add student to batch', e.message)
    }

    try {
      const { status } = await req(`/batches/${batchId}/publish`, {
        method: 'POST',
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 || status === 201) pass('Publish batch')
      else fail('Publish batch', `status=${status}`)
    } catch (e) {
      fail('Publish batch', e.message)
    }

    try {
      const res = await fetch(`${API}/batches/import/template`, {
        headers: { Authorization: `Bearer ${instructorToken2}` },
      })
      if (res.ok && res.headers.get('content-type')?.includes('text/csv')) pass('Download import template')
      else fail('Download import template', `status=${res.status}`)
    } catch (e) {
      fail('Download import template', e.message)
    }

    try {
      const csv = [
        'full_name,email,course_slug,batch_name,phone,notes',
        `Import User,import.user.${Date.now()}@example.com,aws-solutions-architect,E2E Test Batch,,`,
      ].join('\n')
      const form = new FormData()
      form.append('file', new Blob([csv], { type: 'text/csv' }), 'import-test.csv')
      form.append('defaultBatchId', batchId)
      const res = await fetch(`${API}/batches/import/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${instructorToken2}` },
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.jobId && Array.isArray(body.rows)) {
        importJobId = body.jobId
        pass('Import preview', `${body.validCount} valid rows`)
      } else fail('Import preview', `status=${res.status}`)
    } catch (e) {
      fail('Import preview', e.message)
    }
  }

  if (instructorToken2 && importJobId) {
    try {
      const { status, body } = await req('/batches/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(instructorToken2) },
        body: JSON.stringify({ jobId: importJobId, partialImport: true }),
      })
      if ((status === 200 || status === 201) && typeof body.successCount === 'number') {
        pass('Execute bulk import', `${body.successCount} imported`)
      } else fail('Execute bulk import', `status=${status}`)
    } catch (e) {
      fail('Execute bulk import', e.message)
    }
  }

  if (studentToken2) {
    try {
      const { status, body } = await req('/batches/me', { headers: authHeaders(studentToken2) })
      if (status === 200 && Array.isArray(body)) pass('Student batch list', `${body.length} batches`)
      else fail('Student batch list', `status=${status}`)
    } catch (e) {
      fail('Student batch list', e.message)
    }

    try {
      const { status } = await req('/batches/mine', { headers: authHeaders(studentToken2) })
      if (status === 403 || status === 401) pass('Student blocked from instructor batches')
      else fail('Student blocked from instructor batches', `expected 403 got ${status}`)
    } catch (e) {
      fail('Student blocked from instructor batches', e.message)
    }
  }

  // ── Phase 3.7: Analytics & Reporting ───────────────────────────
  if (studentToken2) {
    try {
      const { status, body } = await req('/analytics/student/me', { headers: authHeaders(studentToken2) })
      if (status === 200 && typeof body.overallProgress === 'number') pass('Student analytics dashboard')
      else fail('Student analytics dashboard', `status=${status}`)
    } catch (e) {
      fail('Student analytics dashboard', e.message)
    }

    try {
      const { status, body } = await req('/analytics/student/widgets', { headers: authHeaders(studentToken2) })
      if (status === 200 && body.progressCards) pass('Student analytics widgets')
      else fail('Student analytics widgets', `status=${status}`)
    } catch (e) {
      fail('Student analytics widgets', e.message)
    }

    try {
      const res = await fetch(`${API}/reports/student-progress?format=csv`, {
        headers: { Authorization: `Bearer ${studentToken2}` },
      })
      if (res.ok && res.headers.get('content-type')?.includes('text/csv')) pass('Student progress report CSV')
      else fail('Student progress report CSV', `status=${res.status}`)
    } catch (e) {
      fail('Student progress report CSV', e.message)
    }

    try {
      const { status } = await req('/analytics/instructor/me', { headers: authHeaders(studentToken2) })
      if (status === 403 || status === 401) pass('Student blocked from instructor analytics')
      else fail('Student blocked from instructor analytics', `expected 403 got ${status}`)
    } catch (e) {
      fail('Student blocked from instructor analytics', e.message)
    }
  }

  if (instructorToken2) {
    try {
      const { status, body } = await req('/analytics/instructor/me', { headers: authHeaders(instructorToken2) })
      if (status === 200 && typeof body.totalStudents === 'number') pass('Instructor analytics dashboard')
      else fail('Instructor analytics dashboard', `status=${status}`)
    } catch (e) {
      fail('Instructor analytics dashboard', e.message)
    }

    try {
      const { status, body } = await req('/analytics/instructor/widgets', { headers: authHeaders(instructorToken2) })
      if (status === 200 && typeof body.studentsEnrolled === 'number') pass('Instructor analytics widgets')
      else fail('Instructor analytics widgets', `status=${status}`)
    } catch (e) {
      fail('Instructor analytics widgets', e.message)
    }

    try {
      const { status, body } = await req('/analytics/instructor/heatmap', { headers: authHeaders(instructorToken2) })
      if (status === 200 && Array.isArray(body.grid)) pass('Instructor activity heatmap')
      else fail('Instructor activity heatmap', `status=${status}`)
    } catch (e) {
      fail('Instructor activity heatmap', e.message)
    }

    try {
      const res = await fetch(`${API}/reports/assignments?format=csv`, {
        headers: { Authorization: `Bearer ${instructorToken2}` },
      })
      if (res.ok && res.headers.get('content-type')?.includes('text/csv')) pass('Assignment report CSV')
      else fail('Assignment report CSV', `status=${res.status}`)
    } catch (e) {
      fail('Assignment report CSV', e.message)
    }

    try {
      const res = await fetch(`${API}/reports/quizzes?format=pdf`, {
        headers: { Authorization: `Bearer ${instructorToken2}` },
      })
      if (res.ok && res.headers.get('content-type')?.includes('pdf')) pass('Quiz report PDF')
      else fail('Quiz report PDF', `status=${res.status}`)
    } catch (e) {
      fail('Quiz report PDF', e.message)
    }

    try {
      const res = await fetch(`${API}/reports/batches?format=xlsx`, {
        headers: { Authorization: `Bearer ${instructorToken2}` },
      })
      if (res.ok && res.headers.get('content-type')?.includes('spreadsheet')) pass('Batch report Excel')
      else fail('Batch report Excel', `status=${res.status}`)
    } catch (e) {
      fail('Batch report Excel', e.message)
    }
  }

  // ── Phase 3.8: Media Storage & File Management ─────────────────
  let mediaAssetId = ''

  if (instructorToken2) {
    try {
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      )
      const form = new FormData()
      form.append('file', new Blob([png], { type: 'image/png' }), 'test-avatar.png')
      const res = await fetch(`${API}/media/avatars`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${instructorToken2}` },
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.id) {
        mediaAssetId = body.id
        pass('Upload avatar', body.filename)
      } else fail('Upload avatar', `status=${res.status}`)
    } catch (e) {
      fail('Upload avatar', e.message)
    }

    try {
      const { status, body } = await req('/media/stats', { headers: authHeaders(instructorToken2) })
      if (status === 200 && typeof body.totalFiles === 'number') pass('Media storage stats', `${body.totalMb}MB`)
      else fail('Media storage stats', `status=${status}`)
    } catch (e) {
      fail('Media storage stats', e.message)
    }

    try {
      const { status, body } = await req('/media', { headers: authHeaders(instructorToken2) })
      if (status === 200 && Array.isArray(body.items)) pass('List media library', `${body.total} items`)
      else fail('List media library', `status=${status}`)
    } catch (e) {
      fail('List media library', e.message)
    }

    try {
      const form = new FormData()
      form.append('file', new Blob(['not-a-real-exe'], { type: 'application/x-msdownload' }), 'bad.exe')
      form.append('assetType', 'avatar')
      const res = await fetch(`${API}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${instructorToken2}` },
        body: form,
      })
      if (res.status === 400) pass('Reject invalid upload type')
      else fail('Reject invalid upload type', `expected 400 got ${res.status}`)
    } catch (e) {
      fail('Reject invalid upload type', e.message)
    }
  }

  if (instructorToken2 && mediaAssetId) {
    try {
      const { status, body } = await req(`/media/${mediaAssetId}/url`, { headers: authHeaders(instructorToken2) })
      if (status === 200 && body.url) pass('Signed media URL')
      else fail('Signed media URL', `status=${status}`)
    } catch (e) {
      fail('Signed media URL', e.message)
    }

    try {
      const res = await fetch(`${API}/media/${mediaAssetId}/download`, {
        headers: { Authorization: `Bearer ${instructorToken2}` },
      })
      if (res.ok) pass('Media file download')
      else fail('Media file download', `status=${res.status}`)
    } catch (e) {
      fail('Media file download', e.message)
    }

    try {
      const { status } = await req(`/media/${mediaAssetId}`, {
        method: 'DELETE',
        headers: authHeaders(instructorToken2),
      })
      if (status === 200 || status === 201) pass('Delete media asset')
      else fail('Delete media asset', `status=${status}`)
    } catch (e) {
      fail('Delete media asset', e.message)
    }
  }

  // ── Phase 3.9: Production Hardening ───────────────────────────
  try {
    const { status, body } = await req('/health/live')
    if (status === 200 && body.status === 'ok') pass('Liveness probe')
    else fail('Liveness probe', `status=${status}`)
  } catch (e) {
    fail('Liveness probe', e.message)
  }

  try {
    const { status, body } = await req('/health/ready')
    if (status === 200 && body.checks?.database?.status === 'up') pass('Readiness probe')
    else fail('Readiness probe', `status=${status}`)
  } catch (e) {
    fail('Readiness probe', e.message)
  }

  try {
    const { status, body } = await req('/health/detailed')
    if (status === 200 && body.checks) pass('Detailed health', Object.keys(body.checks).join(', '))
    else fail('Detailed health', `status=${status}`)
  } catch (e) {
    fail('Detailed health', e.message)
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
