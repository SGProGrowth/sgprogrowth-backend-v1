import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { instructorStudents } from '../../../data/instructorData'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { ProgressBar } from '../../../components/student/ProgressBar'

export function InstructorStudentsPage() {
  const [tab, setTab] = useState('all')
  const tabs = [
    { id: 'all', label: 'All students', count: instructorStudents.length },
    { id: 'active', label: 'Active', count: instructorStudents.filter((s) => s.status === 'active').length },
    { id: 'at-risk', label: 'At risk', count: instructorStudents.filter((s) => s.status === 'at-risk').length },
    { id: 'completed', label: 'Completed', count: instructorStudents.filter((s) => s.status === 'completed').length },
  ]
  const filtered = tab === 'all' ? instructorStudents : instructorStudents.filter((s) => s.status === tab)

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Enrollments"
        title="Students & Enrollments"
        description="Track learner progress, identify at-risk students, and manage enrollments across all courses."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total enrolled" value={instructorStudents.length} />
        <StatTile label="At risk" value={instructorStudents.filter((s) => s.status === 'at-risk').length} hint="Needs coaching outreach" />
        <StatTile label="Completed" value={instructorStudents.filter((s) => s.status === 'completed').length} />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState title="No students in this category" description="Students will appear here when they enroll." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
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
        </div>
      )}
    </div>
  )
}

export function InstructorStudentProgressPage() {
  const { studentId } = useParams()
  const student = instructorStudents.find((s) => s.id === studentId) ?? instructorStudents[0]
  if (!student) return null

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
