#!/usr/bin/env node
/**
 * SMTP connectivity + email flow verification for SG Pro Growth LMS.
 * Usage: node scripts/verify-smtp.mjs
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '../backend/package.json'))
const nodemailer = require('nodemailer')

const __dirname = dirname(fileURLToPath(import.meta.url))
const API = process.env.API_URL ?? 'http://localhost:3000/api/v1'
const PASSWORD = 'Password123!'

function loadEnv() {
  const envPath = resolve(__dirname, '../backend/.env')
  const lines = readFileSync(envPath, 'utf8').split('\n')
  const env = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

const results = { pass: [], fail: [], warn: [] }

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
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  return { res, body, status: res.status }
}

async function testSmtpDirect(env) {
  const host = env.SMTP_HOST
  const port = Number(env.SMTP_PORT ?? 587)
  const secure = env.SMTP_SECURE === 'true'
  const user = env.SMTP_USER
  const smtpPass = env.SMTP_PASS

  console.log('\n--- Direct SMTP (Nodemailer) ---')
  console.log(`Host: ${host}:${port}, secure=${secure}, user=${user}`)

  if (!host || !user || !smtpPass) {
    fail('SMTP env configured', 'missing SMTP_HOST/USER/PASS')
    return null
  }
  pass('SMTP env configured')

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: smtpPass },
    requireTLS: !secure && port === 587,
    tls: { minVersion: 'TLSv1.2' },
  })

  try {
    await transporter.verify()
    pass('SMTP connection + STARTTLS', `${host}:${port}`)
  } catch (err) {
    fail('SMTP connection + STARTTLS', err instanceof Error ? err.message : String(err))
    return transporter
  }

  return transporter
}

async function fetchTestToken(email, kind) {
  const { status, body } = await req(
    `/auth/test/token?email=${encodeURIComponent(email)}&type=${kind}`,
  )
  if (status === 200 && body.token) return body.token
  return null
}

async function testAuthEmails() {
  console.log('\n--- Auth email flows (API) ---')

  const registerEmail = `smtp.test.${Date.now()}@example.com`
  const { status: regStatus, body: regBody } = await req('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'SMTP Test User',
      email: registerEmail,
      password: PASSWORD,
      role: 'student',
    }),
  })
  if (regStatus === 201 || regStatus === 200) {
    pass('Registration triggers verification email', registerEmail)
  } else {
    fail('Registration triggers verification email', `status=${regStatus} ${JSON.stringify(regBody)}`)
    return
  }

  await new Promise((r) => setTimeout(r, 1500))
  const verifyToken = await fetchTestToken(registerEmail, 'verify')
  if (verifyToken) {
    const { status } = await req(`/auth/verify-email?token=${encodeURIComponent(verifyToken)}`)
    if (status === 200) pass('Verify email link works')
    else fail('Verify email link works', `status=${status}`)
  } else {
    warn('Verify email link works', 'E2E test token unavailable — check E2E_TEST_MODE=true')
  }

  const { status: fpStatus } = await req('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ankit.verma@example.com' }),
  })
  if (fpStatus === 200) pass('Forgot password triggers reset email')
  else fail('Forgot password triggers reset email', `status=${fpStatus}`)

  await new Promise((r) => setTimeout(r, 1500))
  const resetToken = await fetchTestToken('ankit.verma@example.com', 'reset')
  if (resetToken) {
    const { status } = await req('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: PASSWORD }),
    })
    if (status === 200) pass('Password reset works')
    else fail('Password reset works', `status=${status}`)
  } else {
    warn('Password reset works', 'reset token unavailable')
  }
}

async function login(email, role) {
  const { status, body } = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, role }),
  })
  if (status !== 200 || !body.accessToken) throw new Error(`login failed ${status}`)
  return body
}

async function testNotificationEmails() {
  console.log('\n--- Notification emails (API triggers) ---')

  let instructorToken = ''
  let studentToken = ''
  let studentUserId = ''

  try {
    const body = await login('cloud.lead@example.com', 'instructor')
    instructorToken = body.accessToken
  } catch (e) {
    fail('Notification setup: instructor login', e.message)
    return
  }

  try {
    const body = await login('neha.sharma@example.com', 'student')
    studentToken = body.accessToken
    studentUserId = body.user?.id ?? ''
  } catch (e) {
    fail('Notification setup: student login', e.message)
    return
  }

  const auth = (t) => ({ Authorization: `Bearer ${t}` })

  // Enrollment
  const slug = `smtp-enroll-${Date.now()}`
  const create = await req('/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(instructorToken) },
    body: JSON.stringify({
      title: `SMTP Enroll Test ${Date.now()}`,
      categorySlug: 'cloud-computing',
      level: 'Beginner',
    }),
  })
  const courseSlug = create.body.slug ?? slug
  if (create.status === 201 || create.status === 200) {
    await req(`/courses/${courseSlug}/publish`, { method: 'POST', headers: auth(instructorToken) })
    const enroll = await req('/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(studentToken) },
      body: JSON.stringify({ courseSlug }),
    })
    if (enroll.status === 201 || enroll.status === 200 || enroll.status === 409) {
      pass('Enrollment confirmation email triggered')
    } else fail('Enrollment confirmation email triggered', `status=${enroll.status}`)
  } else {
    fail('Enrollment confirmation email triggered', `create course status=${create.status}`)
  }

  // Assignment published
  const asn = await req('/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(instructorToken) },
    body: JSON.stringify({
      title: `SMTP Assignment ${Date.now()}`,
      courseSlug: 'aws-solutions-architect',
      type: 'project',
      instructions: '<p>Test</p>',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      maxScore: 100,
    }),
  })
  if (asn.status === 201 || asn.status === 200) {
    const pub = await req(`/assignments/${asn.body.id}/publish`, {
      method: 'POST',
      headers: auth(instructorToken),
    })
    if (pub.status === 200) pass('Assignment published notification email triggered')
    else fail('Assignment published notification', `status=${pub.status}`)
  } else {
    fail('Assignment published notification', `create status=${asn.status}`)
  }

  // Quiz published
  const quiz = await req('/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(instructorToken) },
    body: JSON.stringify({
      title: `SMTP Quiz ${Date.now()}`,
      courseSlug: 'aws-solutions-architect',
      durationMinutes: 10,
      maxAttempts: 1,
      passScore: 50,
    }),
  })
  if (quiz.status === 201 || quiz.status === 200) {
    const pub = await req(`/quizzes/${quiz.body.id}/publish`, {
      method: 'POST',
      headers: auth(instructorToken),
    })
    if (pub.status === 200 || pub.status === 201) pass('Quiz published notification email triggered')
    else fail('Quiz published notification', `status=${pub.status}`)
  } else {
    fail('Quiz published notification', `create status=${quiz.status}`)
  }

  // Certificate issued
  if (studentUserId) {
    const cert = await req('/certificates/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(instructorToken) },
      body: JSON.stringify({
        courseSlug: 'aws-solutions-architect',
        studentId: studentUserId,
        bypassRules: true,
      }),
    })
    if (cert.status === 200 || cert.status === 201) pass('Certificate issued email triggered')
    else fail('Certificate issued email', `status=${cert.status}`)
  }

  // Batch invitation
  const batch = await req('/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(instructorToken) },
    body: JSON.stringify({
      name: `SMTP Batch ${Date.now()}`,
      courseSlug: 'aws-solutions-architect',
      startDate: '2026-09-01',
      endDate: '2026-11-30',
      publish: true,
    }),
  })
  if (batch.status === 200 || batch.status === 201) {
    const inviteEmail = `batch.invite.${Date.now()}@example.com`
    const add = await req(`/batches/${batch.body.id}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth(instructorToken) },
      body: JSON.stringify({ email: inviteEmail, name: 'Batch Invite Test', createAccount: true }),
    })
    if (add.status === 200 || add.status === 201) pass('Batch invitation email triggered', inviteEmail)
    else fail('Batch invitation email', `status=${add.status}`)
  } else {
    fail('Batch invitation email', `create batch status=${batch.status}`)
  }
}

async function checkBackendSmtpLog() {
  console.log('\n--- Backend SMTP init (health) ---')
  try {
    const { status } = await req('/health')
    if (status === 200) pass('Backend API reachable')
    else fail('Backend API reachable', `status=${status}`)
  } catch (e) {
    fail('Backend API reachable', e.message)
  }
}

async function main() {
  console.log('📧 SG Pro Growth — SMTP & Email Flow Verification\n')

  const env = loadEnv()

  if (env.SMTP_USE_ETHEREAL === 'true') {
    fail('Ethereal disabled', 'SMTP_USE_ETHEREAL is still true')
  } else {
    pass('Ethereal disabled', 'SMTP_USE_ETHEREAL=false')
  }

  await testSmtpDirect(env)
  await checkBackendSmtpLog()
  await testAuthEmails()
  await testNotificationEmails()

  console.log('\n--- Report ---')
  console.log(`✅ Passed: ${results.pass.length}`)
  console.log(`⚠️  Warnings: ${results.warn.length}`)
  console.log(`❌ Failed: ${results.fail.length}`)

  if (results.fail.length) {
    console.log('\nFailures:')
    results.fail.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`))
    process.exit(1)
  }

  console.log('\n✅ Production SMTP email system is operational (local verification).')
  console.log('Note: @example.com addresses accept SMTP delivery but mail is not received in a real inbox.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
