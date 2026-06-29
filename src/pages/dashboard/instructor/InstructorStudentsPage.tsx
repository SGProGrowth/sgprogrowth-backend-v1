import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { ProgressBar } from '../../../components/student/ProgressBar'
import { Button } from '../../../components/ui/Button'
import { ResponsiveTable, MobileDataCard } from '../../../components/ui/ResponsiveTable'

export function InstructorStudentsPage() {
  const { workspace } = useInstructorDashboard()
  const instructorStudents = workspace?.students ?? []
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const tabs = [
    { id: 'all', label: 'All students', count: instructorStudents.length },
    { id: 'active', label: 'Active', count: instructorStudents.filter((s) => s.status === 'active').length },
    { id: 'at-risk', label: 'At risk', count: instructorStudents.filter((s) => s.status === 'at-risk').length },
    { id: 'completed', label: 'Completed', count: instructorStudents.filter((s) => s.status === 'completed').length },
  ]
  const filtered = (tab === 'all' ? instructorStudents : instructorStudents.filter((s) => s.status === tab))
    .filter((s) => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Enrollments"
        title="Students & Enrollments"
        description="Track learner progress, identify at-risk students, and manage enrollments across all courses."
        action={
          <Link to="/instructor/students/import">
            <Button variant="primary" size="md">Bulk import</Button>
          </Link>
        }
      />

      <div className="stat-grid-3 mb-6 sm:mb-8">
        <StatTile label="Total enrolled" value={instructorStudents.length} />
        <StatTile label="At risk" value={instructorStudents.filter((s) => s.status === 'at-risk').length} hint="Needs coaching outreach" />
        <StatTile label="Completed" value={instructorStudents.filter((s) => s.status === 'completed').length} />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <input
        type="search"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field h-10 w-full max-w-md mb-6"
      />

      {filtered.length === 0 ? (
        <EmptyState title="No students in this category" description="Students will appear here when they enroll." />
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => (
              <MobileDataCard
                key={s.id}
                title={
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-800">{s.avatarInitials}</div>
                    <div className="min-w-0">
                      <span>{s.name}</span>
                      <p className="text-xs font-normal text-ink-3 truncate">{s.email}</p>
                    </div>
                  </div>
                }
                badge={<StatusBadge status={s.status} />}
                fields={[
                  { label: 'Course', value: s.courseTitle },
                  { label: 'Progress', value: (
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.progress} size="sm" />
                      <span className="text-xs font-semibold">{s.progress}%</span>
                    </div>
                  ) },
                  { label: 'Last active', value: s.lastActive },
                ]}
                actions={
                  <Link to={`/instructor/students/${s.id}`} className="text-sm font-semibold text-forest-800 min-h-11 inline-flex items-center">
                    View progress
                  </Link>
                }
              />
            ))}
          </div>

          {/* Desktop table */}
          <ResponsiveTable className="hidden md:block rounded-xl border border-stone-200 bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left">
                  <th className="px-5 py-3 font-semibold text-ink-2">Student</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Course</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Progress</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Last active</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Status</th>
                  <th className="px-5 py-3 font-semibold text-ink-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-800">{s.avatarInitials}</div>
                        <div>
                          <p className="font-semibold text-ink">{s.name}</p>
                          <p className="text-xs text-ink-3">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-2">{s.courseTitle}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <ProgressBar value={s.progress} size="sm" />
                        <span className="text-xs font-semibold">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-3">{s.lastActive}</td>
                    <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-4">
                      <Link to={`/instructor/students/${s.id}`} className="text-sm font-semibold text-forest-800">View progress</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        </>
      )}
    </div>
  )
}

export function InstructorStudentProgressPage() {
  const { studentId } = useParams()
  const { workspace } = useInstructorDashboard()
  const instructorStudents = workspace?.students ?? []
  const student = instructorStudents.find((s) => s.id === studentId)
  if (!student) {
    return (
      <div className="animate-rise max-w-3xl">
        <PageIntro eyebrow="Student progress" title="Student not found" description="This learner is not enrolled in your courses." />
        <Link to="/instructor/students" className="inline-block text-sm font-semibold text-forest-800">← Back to roster</Link>
      </div>
    )
  }

  return (
    <div className="animate-rise max-w-3xl">
      <PageIntro eyebrow="Student progress" title={student.name} description={`${student.courseTitle} · Enrolled ${student.enrolledDate}`} />
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-ink">Overall progress</span>
          <span className="font-display text-2xl font-bold text-forest-800">{student.progress}%</span>
        </div>
        <ProgressBar value={student.progress} size="lg" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-stone-50 p-4"><p className="text-xs text-ink-3">Modules completed</p><p className="font-bold text-ink">7 / 10</p></div>
          <div className="rounded-lg bg-stone-50 p-4"><p className="text-xs text-ink-3">Coaching sessions</p><p className="font-bold text-ink">4 attended</p></div>
        </div>
      </div>
      <Link to="/instructor/students" className="mt-6 inline-block text-sm font-semibold text-forest-800">← Back to roster</Link>
    </div>
  )
}
