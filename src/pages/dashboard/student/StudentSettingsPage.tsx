import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useStudentDashboard } from '../../../contexts/DashboardWorkspaceContext'
import { defaultLearningPreferences } from '../../../data/studentData'
import { PageIntro, Panel } from '../../../components/student/Panel'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { uploadAvatar } from '../../../lib/api/media'
import { changePassword, updateStudentProfile } from '../../../lib/api/profile'
import { getErrorMessage } from '../../../lib/api/errors'
import { AlertBanner } from '../../../components/ui/AlertBanner'
import { Button } from '../../../components/ui/Button'

export function StudentSettingsPage() {
  const { user } = useAuth()
  const { profile, refresh } = useStudentDashboard()
  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [organization, setOrganization] = useState(profile?.organization ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Asia/Kolkata')
  const [prefs, setPrefs] = useState(defaultLearningPreferences)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.name || user?.name || '')
    setTitle(profile.title ?? '')
    setOrganization(profile.organization ?? '')
    setPhone(profile.phone ?? '')
    setTimezone(profile.timezone ?? 'Asia/Kolkata')
    const saved = profile.preferences
    if (saved && typeof saved === 'object') {
      setPrefs({ ...defaultLearningPreferences, ...saved } as typeof defaultLearningPreferences)
    }
  }, [profile, user?.name])

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      await updateStudentProfile({
        displayName: displayName.trim(),
        title: title.trim() || undefined,
        organizationLabel: organization.trim() || undefined,
        phone: phone.trim() || undefined,
        timezone,
        avatarUrl,
        preferences: prefs as unknown as Record<string, unknown>,
      })
      if (currentPassword && newPassword) {
        await changePassword(currentPassword, newPassword)
        setCurrentPassword('')
        setNewPassword('')
      }
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
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
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-start">
            <div className="w-full max-w-[200px] shrink-0">
              <UploadZone
                label="Profile photo"
                hint="Square image, min 200×200px"
                previewUrl={avatarUrl}
                uploadFn={async (file, onProgress) => {
                  const asset = await uploadAvatar(file, onProgress)
                  setAvatarUrl(asset.downloadUrl)
                }}
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink">Full name</label>
                <input id="name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
                <input id="email" type="email" value={user?.email ?? ''} readOnly className="input-field w-full bg-stone-50" />
              </div>
              <div>
                <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold text-ink">Professional headline</label>
                <input id="bio" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field w-full" placeholder="e.g. Software Engineer · AWS track" />
              </div>
              <div>
                <label htmlFor="org" className="mb-1.5 block text-sm font-semibold text-ink">Organization</label>
                <input id="org" type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-ink">Phone</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field w-full" />
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
              <select id="pace" className="input-field w-full max-w-xs" value={prefs.learningPace} onChange={(e) => setPrefs((p) => ({ ...p, learningPace: e.target.value as typeof p.learningPace }))}>
                <option value="relaxed">Relaxed — steady progress</option>
                <option value="moderate">Moderate — balanced</option>
                <option value="intensive">Intensive — certification focus</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="mb-1.5 block text-sm font-semibold text-ink">Timezone</label>
              <select id="timezone" className="input-field w-full max-w-xs" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
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
              <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field w-full max-w-md" placeholder="••••••••" />
            </div>
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field w-full max-w-md" placeholder="At least 8 characters" />
            </div>
          </div>
        </Panel>

        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {saved && (
            <AlertBanner variant="success" className="flex-1 py-2 sm:max-w-xs" role="status">
              Settings saved successfully
            </AlertBanner>
          )}
        </div>
      </div>
    </div>
  )
}
