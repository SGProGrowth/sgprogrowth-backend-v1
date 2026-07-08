#!/usr/bin/env node
/**
 * Data isolation verification — ensures students/instructors cannot access each other's data.
 */
const API = process.env.API_URL ?? 'http://localhost:3000/api/v1'
const PASSWORD = 'Password123!'

const results = { pass: [], fail: [] }

function pass(n, d = '') { results.pass.push(n); console.log(`✅ ${n}${d ? ` — ${d}` : ''}`) }
function fail(n, d = '') { results.fail.push(n); console.error(`❌ ${n}${d ? ` — ${d}` : ''}`) }

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json', ...(opts.headers ?? {}) },
    ...opts,
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function login(email, role) {
  const { status, body } = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, role }),
  })
  if (status !== 200 || !body.accessToken) throw new Error(`login ${email} failed ${status}`)
  return body
}

async function main() {
  console.log('\n🔒 Data isolation verification\n')

  const neha = await login('neha.sharma@example.com', 'student')
  const ankit = await login('ankit.verma@example.com', 'student')
  const instructor = await login('cloud.lead@example.com', 'instructor')

  const auth = (t) => ({ Authorization: `Bearer ${t}` })

  // Cross-role: student cannot access instructor endpoints
  const studentToInstructor = [
    ['/instructors/me', 'student → instructor workspace'],
    ['/courses/mine', 'student → instructor courses'],
    ['/assignments/mine', 'student → instructor assignments'],
    ['/quizzes/mine', 'student → instructor quizzes'],
    ['/batches/mine', 'student → instructor batches'],
    ['/certificates/mine', 'student → instructor certificates'],
    ['/analytics/instructor/me', 'student → instructor analytics'],
  ]
  for (const [path, label] of studentToInstructor) {
    const { status } = await req(path, { headers: auth(neha.accessToken) })
    if (status === 403 || status === 401) pass(label, `blocked (${status})`)
    else fail(label, `expected 403 got ${status}`)
  }

  // Cross-role: instructor cannot access student workspace
  const instructorToStudent = [
    ['/students/me', 'instructor → student workspace'],
    ['/enrollments/me', 'instructor → student enrollments'],
    ['/assignments/me', 'instructor → student assignments'],
    ['/quizzes/me', 'instructor → student quizzes'],
    ['/certificates/me', 'instructor → student certificates'],
    ['/analytics/student/me', 'instructor → student analytics'],
  ]
  for (const [path, label] of instructorToStudent) {
    const { status } = await req(path, { headers: auth(instructor.accessToken) })
    if (status === 403 || status === 401) pass(label, `blocked (${status})`)
    else fail(label, `expected 403 got ${status}`)
  }

  // Student data scoped to self
  const nehaWs = await req('/students/me', { headers: auth(neha.accessToken) })
  const ankitWs = await req('/students/me', { headers: auth(ankit.accessToken) })
  if (nehaWs.status === 200 && ankitWs.status === 200) {
    const nehaEmail = nehaWs.body.profile?.email
    const ankitEmail = ankitWs.body.profile?.email
    if (nehaEmail === 'neha.sharma@example.com') pass('Student workspace scoped to self (neha)')
    else fail('Student workspace scoped to self (neha)', nehaEmail)
    if (ankitEmail === 'ankit.verma@example.com') pass('Student workspace scoped to self (ankit)')
    else fail('Student workspace scoped to self (ankit)', ankitEmail)

    const nehaCerts = nehaWs.body.certificates ?? []
    const ankitCerts = ankitWs.body.certificates ?? []
    const overlap = nehaCerts.some((c) => ankitCerts.some((a) => a.id === c.id && c.studentId !== a.studentId))
    if (!overlap || nehaCerts.length === 0 || ankitCerts.length === 0) {
      pass('Student certificates isolated per account')
    } else {
      fail('Student certificates isolated', 'shared cert ids across students')
    }
  } else {
    fail('Student workspace fetch', `neha=${nehaWs.status} ankit=${ankitWs.status}`)
  }

  // Instructor only sees own courses in /courses/mine
  const mine = await req('/courses/mine', { headers: auth(instructor.accessToken) })
  if (mine.status === 200 && Array.isArray(mine.body.data)) {
    const allOwned = mine.body.data.every((c) => c.instructorId === instructor.user?.id || !c.instructorId)
    if (allOwned || mine.body.data.length === 0) pass('Instructor courses scoped to owner')
    else fail('Instructor courses scoped', 'foreign course in list')
  } else {
    fail('Instructor courses list', `status=${mine.status}`)
  }

  // Unauthenticated blocked
  const unauth = await req('/students/me')
  if (unauth.status === 401) pass('Unauthenticated access blocked')
  else fail('Unauthenticated access', `expected 401 got ${unauth.status}`)

  console.log(`\n--- Summary: ${results.pass.length} passed, ${results.fail.length} failed ---`)
  process.exit(results.fail.length ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
