import { useState } from 'react'
import { announcements, instructorMessages, liveSessions } from '../../../data/instructorData'
import { PageIntro, TabBar } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'

export function InstructorCoachingPage() {
  const [tab, setTab] = useState('upcoming')
  const [showSchedule, setShowSchedule] = useState(false)
  const [saved, setSaved] = useState(false)

  const upcoming = liveSessions.filter((s) => s.status === 'scheduled')
  const completed = liveSessions.filter((s) => s.status === 'completed')

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Completed', count: completed.length },
  ]

  const displayed = tab === 'upcoming' ? upcoming : completed

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Coaching"
        title="Live Session Scheduling"
        description="Schedule 1:1 coaching, group sessions, and office hours — the core of SG Pro Growth."
        action={<Button variant="primary" size="md" onClick={() => setShowSchedule(true)}>+ Schedule session</Button>}
      />

      {saved && <SuccessBanner message="Session scheduled successfully." onDismiss={() => setSaved(false)} />}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="grid gap-4 sm:grid-cols-2">
        {displayed.map((s) => (
          <div key={s.id} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-ink">{s.title}</p>
                <p className="text-sm text-ink-3 mt-0.5">{s.courseTitle}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-4 space-y-1 text-sm text-ink-2">
              {s.studentName && <p>With: {s.studentName}</p>}
              <p>{s.date} · {s.time} · {s.duration}</p>
            </div>
            {s.status === 'scheduled' && (
              <div className="mt-4 flex gap-2">
                <Button variant="primary" size="sm">Join meeting</Button>
                <Button variant="ghost" size="sm">Reschedule</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Schedule live session"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowSchedule(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={() => { setShowSchedule(false); setSaved(true) }}>Schedule session</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Session title" placeholder="e.g. AWS Exam Strategy — 1:1" required />
          <SelectField label="Session type" options={[
            { value: '1:1', label: '1:1 Coaching' },
            { value: 'group', label: 'Group session' },
            { value: 'office-hours', label: 'Office hours' },
          ]} />
          <FormField label="Date" type="date" required />
          <FormField label="Time" type="time" required />
          <FormField label="Duration" placeholder="60 min" />
          <SelectField label="Course" options={[
            { value: 'aws', label: 'AWS Solutions Architect' },
            { value: 'pm', label: 'IT Project Management' },
          ]} />
          <div className="sm:col-span-2">
            <FormField label="Student (for 1:1)" placeholder="Search student name…" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function InstructorAnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Communications"
        title="Announcements"
        description="Send course updates, deadline reminders, and coaching announcements to learners."
        action={<Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ New announcement</Button>}
      />

      {saved && <SuccessBanner message="Announcement sent to learners." onDismiss={() => setSaved(false)} />}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{a.title}</p>
                <p className="text-sm text-ink-3 mt-0.5">{a.courseTitle} · {a.date}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-3 text-sm text-ink-2">{a.message}</p>
          </div>
        ))}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create announcement"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Save draft</button>
            <button type="button" className="btn-primary" onClick={() => { setShowCreate(false); setSaved(true) }}>Send now</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Title" required />
          <SelectField label="Course" options={[
            { value: 'aws', label: 'AWS Solutions Architect' },
            { value: 'pm', label: 'IT Project Management' },
          ]} />
          <SelectField label="Audience" options={[
            { value: 'all', label: 'All enrolled students' },
            { value: 'at-risk', label: 'At-risk learners' },
          ]} />
          <FormField label="Message" />
        </div>
      </Modal>
    </div>
  )
}

export function InstructorMessagesPage() {
  const [selected, setSelected] = useState<string | null>(instructorMessages[0]?.id ?? null)
  const active = instructorMessages.find((m) => m.id === selected)

  return (
    <div className="animate-rise">
      <PageIntro eyebrow="Inbox" title="Messages" description="Conversations with students and platform support." />

      <div className="grid overflow-hidden rounded-xl border border-stone-200 bg-white lg:grid-cols-5 min-h-[480px]">
        <div className="border-b border-stone-200 lg:border-b-0 lg:border-r divide-y divide-stone-100 lg:col-span-2">
          {instructorMessages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.id)}
              className={`w-full px-4 py-4 text-left hover:bg-stone-50 ${selected === m.id ? 'bg-forest-50/50' : ''} ${!m.read ? 'border-l-2 border-l-forest-600' : ''}`}
            >
              <p className={`text-sm truncate ${!m.read ? 'font-bold text-ink' : 'font-medium text-ink-2'}`}>{m.from}</p>
              <p className="text-sm text-ink-2 truncate">{m.subject}</p>
              <p className="text-xs text-ink-3 truncate">{m.preview}</p>
            </button>
          ))}
        </div>
        <div className="p-6 lg:col-span-3">
          {active && (
            <>
              <h3 className="font-display font-bold text-ink">{active.subject}</h3>
              <p className="text-sm text-ink-3 mt-1">From {active.from}</p>
              <div className="mt-6 rounded-lg bg-stone-50 p-4 text-sm text-ink-2">{active.preview}</div>
              <textarea className="input-field w-full py-3 mt-6" rows={3} placeholder="Type your reply…" />
              <Button variant="primary" size="md" className="mt-3">Send reply</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
