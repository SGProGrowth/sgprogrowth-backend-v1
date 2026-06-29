import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, Panel, StatTile } from '../../../components/dashboard/PageShell'
import { Button } from '../../../components/ui/Button'

const payoutHistory = [
  { id: 'p1', period: 'May 2026', amount: '₹42,800', status: 'Paid', date: 'Jun 5, 2026' },
  { id: 'p2', period: 'Apr 2026', amount: '₹38,200', status: 'Paid', date: 'May 5, 2026' },
  { id: 'p3', period: 'Mar 2026', amount: '₹35,600', status: 'Paid', date: 'Apr 5, 2026' },
]

export function InstructorEarningsPage() {
  const { workspace } = useInstructorDashboard()

  const { summary, analytics } = workspace
  const topCourse = analytics.topCourses[0]

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Revenue"
        title="Earnings & Payouts"
        description="Track course revenue, pending payouts, and monthly performance."
        action={<Button variant="secondary" size="md">Download statement</Button>}
      />

      <div className="stat-grid mb-8">
        <StatTile label="Monthly revenue" value={summary.monthlyRevenue} hint="Current period" />
        <StatTile label="Total students" value={summary.studentsEnrolled} hint="Enrolled learners" />
        <StatTile label="Published courses" value={summary.coursesPublished} hint="Active revenue streams" />
        <StatTile label="Top course" value={topCourse?.title.split(' ').slice(0, 2).join(' ') ?? '—'} hint={topCourse ? `★ ${topCourse.rating}` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payout history">
          <ul className="divide-y divide-stone-100">
            {payoutHistory.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <div>
                  <p className="text-sm font-semibold text-ink">{p.period}</p>
                  <p className="text-xs text-ink-3">Paid {p.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-forest-800">{p.amount}</p>
                  <p className="text-xs text-ink-3">{p.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Payout settings">
          <div className="space-y-4 text-sm text-ink-2">
            <p>Payouts are processed monthly to your verified bank account on file.</p>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p className="text-xs text-ink-3">Next payout estimate</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{summary.monthlyRevenue}</p>
              <p className="mt-1 text-xs text-ink-3">Scheduled for the 5th of next month</p>
            </div>
            <Button to="/instructor/settings" variant="primary" size="md">Manage payout details</Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
