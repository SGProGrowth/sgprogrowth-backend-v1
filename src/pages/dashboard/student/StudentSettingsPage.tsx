import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { defaultLearningPreferences } from '../../../data/studentData'
import { PageIntro, Panel } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'

export function StudentSettingsPage() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(defaultLearningPreferences)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const togglePref = (key: keyof typeof prefs) => {
    if (typeof prefs[key] === 'boolean') {
      setPrefs((p) => ({ ...p, [key]: !p[key] }))
    }
  }

  return (
    <div className="animate-rise max-w-3xl">
      <PageIntro
        eyebrow="Account"
        title="Profile & Settings"
        description="Manage your profile, learning preferences, and notification settings."
      />

      <div className="space-y-6">
        <Panel title="Profile">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xl font-bold text-forest-800">
              {user?.avatarInitials}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink">Full name</label>
                <input id="name" type="text" defaultValue={user?.name} className="input-field w-full" />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
                <input id="email" type="email" defaultValue={user?.email} className="input-field w-full" />
              </div>
              <div>
                <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold text-ink">Professional headline</label>
                <input id="bio" type="text" defaultValue="Aspiring Cloud Engineer" className="input-field w-full" placeholder="e.g. Software Engineer · AWS track" />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Learning preferences">
          <div className="space-y-5">
            <div>
              <label htmlFor="weeklyGoal" className="mb-1.5 block text-sm font-semibold text-ink">
                Weekly learning goal
              </label>
              <select
                id="weeklyGoal"
                className="input-field w-full max-w-xs"
                value={prefs.weeklyGoalHours}
                onChange={(e) => setPrefs((p) => ({ ...p, weeklyGoalHours: Number(e.target.value) }))}
              >
                <option value={5}>5 hours / week</option>
                <option value={10}>10 hours / week</option>
                <option value={15}>15 hours / week</option>
                <option value={20}>20 hours / week</option>
              </select>
            </div>

            <div>
              <label htmlFor="pace" className="mb-1.5 block text-sm font-semibold text-ink">Learning pace</label>
              <select id="pace" className="input-field w-full max-w-xs" defaultValue={prefs.learningPace}>
                <option value="relaxed">Relaxed — steady progress</option>
                <option value="moderate">Moderate — balanced</option>
                <option value="intensive">Intensive — certification focus</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="mb-1.5 block text-sm font-semibold text-ink">Timezone</label>
              <select id="timezone" className="input-field w-full max-w-xs" defaultValue={prefs.timezone}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Preferred categories</p>
              <div className="flex flex-wrap gap-2">
                {prefs.preferredCategories.map((cat) => (
                  <span key={cat} className="rounded-md bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-800">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Notifications">
          <div className="space-y-4">
            {([
              ['emailNotifications', 'Email notifications', 'Receive updates via email'],
              ['deadlineReminders', 'Deadline reminders', 'Alerts before assignment due dates'],
              ['coachingReminders', 'Coaching reminders', 'Reminders before 1:1 sessions'],
              ['courseUpdates', 'Course updates', 'New modules and content releases'],
            ] as const).map(([key, label, desc]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-100 px-4 py-3 hover:bg-stone-50">
                <div>
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-xs text-ink-3">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={() => togglePref(key)}
                  className="h-4 w-4 rounded border-stone-300 text-forest-700 focus:ring-forest-600"
                />
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Account security">
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-semibold text-ink">Current password</label>
              <input id="currentPassword" type="password" className="input-field w-full max-w-md" placeholder="••••••••" />
            </div>
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
              <input id="newPassword" type="password" className="input-field w-full max-w-md" placeholder="At least 8 characters" />
            </div>
          </div>
        </Panel>

        <div className="flex items-center gap-4">
          <Button variant="primary" size="md" onClick={handleSave}>Save changes</Button>
          {saved && <span className="text-sm font-semibold text-forest-700">Settings saved</span>}
        </div>
      </div>
    </div>
  )
}
