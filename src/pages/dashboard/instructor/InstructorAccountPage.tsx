import { useState } from 'react'
import { instructorProfile } from '../../../data/instructorData'
import { PageIntro, Panel } from '../../../components/dashboard/PageShell'
import { FormField, TextAreaField } from '../../../components/instructor/FormField'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { SuccessBanner } from '../../../components/instructor/Modal'
import { Button } from '../../../components/ui/Button'

export function InstructorProfilePage() {
  const [saved, setSaved] = useState(false)

  return (
    <div className="animate-rise max-w-3xl">
      <PageIntro eyebrow="Public profile" title="Instructor Profile" description="Your public teaching profile visible to prospective students." />

      {saved && <SuccessBanner message="Profile updated successfully." onDismiss={() => setSaved(false)} />}

      <div className="space-y-6">
        <Panel title="Profile photo">
          <UploadZone label="Upload profile photo" hint="Square image, min 200×200px" />
        </Panel>

        <Panel title="Professional info">
          <div className="space-y-4">
            <FormField label="Display name" defaultValue={instructorProfile.name} />
            <FormField label="Professional title" defaultValue={instructorProfile.title} />
            <TextAreaField label="Bio" defaultValue={instructorProfile.bio} rows={5} />
            <FormField label="Public profile URL" defaultValue={instructorProfile.publicUrl} hint="Sharva Group members directory link" />
          </div>
        </Panel>

        <Panel title="Expertise & credentials">
          <div className="flex flex-wrap gap-2 mb-4">
            {instructorProfile.expertise.map((e) => (
              <span key={e} className="rounded-md bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-800">{e}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {instructorProfile.credentials.map((c) => (
              <span key={c} className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-semibold text-ink-2">{c}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Teaching stats">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-xs text-ink-3">Total students</p><p className="font-display text-2xl font-bold text-ink">{instructorProfile.totalStudents}</p></div>
            <div><p className="text-xs text-ink-3">Courses published</p><p className="font-display text-2xl font-bold text-ink">{instructorProfile.coursesPublished}</p></div>
            <div><p className="text-xs text-ink-3">Average rating</p><p className="font-display text-2xl font-bold text-ink">★ {instructorProfile.avgRating}</p></div>
          </div>
        </Panel>

        <Button variant="primary" size="md" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}>Save profile</Button>
      </div>
    </div>
  )
}

export function InstructorSettingsPage() {
  const [saved, setSaved] = useState(false)

  return (
    <div className="animate-rise max-w-3xl">
      <PageIntro eyebrow="Account" title="Account Settings" description="Payout details, notifications, and security preferences." />

      {saved && <SuccessBanner message="Settings saved." onDismiss={() => setSaved(false)} />}

      <div className="space-y-6">
        <Panel title="Payout information">
          <div className="space-y-4">
            <FormField label="Bank account name" placeholder="Account holder name" />
            <FormField label="Account number" placeholder="••••••••••" />
            <FormField label="IFSC code" placeholder="SBIN0001234" />
            <p className="text-xs text-ink-3">Payouts are processed monthly to verified bank accounts.</p>
          </div>
        </Panel>

        <Panel title="Notification preferences">
          <div className="space-y-3">
            {['New enrollments', 'Assignment submissions', 'Student messages', 'Session reminders', 'Platform updates'].map((label) => (
              <label key={label} className="flex items-center justify-between rounded-lg border border-stone-100 px-4 py-3">
                <span className="text-sm font-medium text-ink">{label}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-forest-700" />
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Security">
          <div className="space-y-4">
            <FormField label="Current password" type="password" />
            <FormField label="New password" type="password" />
            <FormField label="Confirm password" type="password" />
          </div>
        </Panel>

        <Button variant="primary" size="md" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}>Save settings</Button>
      </div>
    </div>
  )
}
