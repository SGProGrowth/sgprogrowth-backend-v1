import { useEffect, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, Panel } from '../../../components/dashboard/PageShell'
import { FormField, TextAreaField } from '../../../components/instructor/FormField'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { uploadAvatar } from '../../../lib/api/media'
import { updateInstructorProfile } from '../../../lib/api/profile'
import { changePassword } from '../../../lib/api/profile'
import { getErrorMessage } from '../../../lib/api/errors'
import { SuccessBanner } from '../../../components/instructor/Modal'
import { Button } from '../../../components/ui/Button'

export function InstructorProfilePage() {
  const { profile, workspace, refresh } = useInstructorDashboard()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [organization, setOrganization] = useState(profile?.organization ?? '')
  const [designation, setDesignation] = useState(profile?.designation ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [experience, setExperience] = useState(profile?.experience ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.name)
    setPhone(profile.phone ?? '')
    setOrganization(profile.organization ?? '')
    setDesignation(profile.designation ?? '')
    setTitle(profile.title ?? '')
    setExperience(profile.experience ?? '')
    setBio(profile.bio ?? '')
  }, [profile])

  if (!profile || !workspace) {
    return (
      <div className="animate-rise rounded-xl border border-stone-200 bg-white px-6 py-12 text-center">
        <p className="font-display text-base font-bold text-ink">Profile unavailable</p>
        <p className="mt-2 text-sm text-ink-3">Sign in with a registered instructor account.</p>
      </div>
    )
  }

  const { summary } = workspace

  return (
    <div className="animate-rise max-w-3xl">
      <PageIntro eyebrow="Public profile" title="Instructor Profile" description="Your public teaching profile visible to prospective students." />

      {saved && <SuccessBanner message="Profile updated successfully." onDismiss={() => setSaved(false)} />}

      <div className="space-y-6">
        <Panel title="Profile photo">
          <UploadZone label="Upload profile photo" hint="Square image, min 200×200px" uploadFn={(file, onProgress) => uploadAvatar(file, onProgress).then(() => undefined)} />
        </Panel>

        <Panel title="Professional info">
          <div className="space-y-4">
            <FormField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <FormField label="Email" defaultValue={profile.email} type="email" readOnly />
            <FormField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <FormField label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            <FormField label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            <FormField label="Professional title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <FormField label="Experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
            <TextAreaField label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
            <FormField label="Public profile URL" defaultValue={profile.publicUrl} hint="Members directory link" readOnly />
          </div>
        </Panel>

        <Panel title="Skills">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="rounded-md bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-900">{skill}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Expertise & credentials">
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.expertise.map((e) => (
              <span key={e} className="rounded-md bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-800">{e}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.credentials.map((c) => (
              <span key={c} className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-semibold text-ink-2">{c}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Teaching stats">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-xs text-ink-3">Students enrolled</p><p className="font-display text-2xl font-bold text-ink">{summary.studentsEnrolled}</p></div>
            <div><p className="text-xs text-ink-3">Courses created</p><p className="font-display text-2xl font-bold text-ink">{summary.coursesCreated}</p></div>
            <div><p className="text-xs text-ink-3">Courses published</p><p className="font-display text-2xl font-bold text-ink">{summary.coursesPublished}</p></div>
            <div><p className="text-xs text-ink-3">Average rating</p><p className="font-display text-2xl font-bold text-ink">★ {profile.avgRating}</p></div>
          </div>
        </Panel>

        <Button
          variant="primary"
          size="md"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await updateInstructorProfile({
                displayName: displayName.trim(),
                phone: phone.trim() || undefined,
                organizationLabel: organization.trim() || undefined,
                designation: designation.trim() || undefined,
                title: title.trim() || undefined,
                experience: experience.trim() || undefined,
                bio: bio.trim() || undefined,
              })
              await refresh()
              setSaved(true)
              setTimeout(() => setSaved(false), 3000)
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </div>
  )
}

export function InstructorSettingsPage() {
  const { profile } = useInstructorDashboard()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSavePassword = async () => {
    setError('')
    if (!currentPassword || !newPassword) {
      setError('Enter your current and new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-rise max-w-3xl">
      <PageIntro eyebrow="Account" title="Account Settings" description="Security preferences and account information." />

      {saved && <SuccessBanner message="Password updated successfully." onDismiss={() => setSaved(false)} />}
      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="space-y-6">
        <Panel title="Contact information">
          <div className="space-y-4">
            <FormField label="Email address" defaultValue={profile?.email ?? ''} type="email" readOnly />
            <FormField label="Phone number" defaultValue={profile?.phone ?? ''} readOnly />
            <FormField label="Organization" defaultValue={profile?.organization ?? ''} readOnly />
            <p className="text-xs text-ink-3">Update contact details on your <a href="/instructor/profile" className="font-semibold text-forest-800">public profile</a>.</p>
          </div>
        </Panel>

        <Panel title="Payout information">
          <p className="text-sm text-ink-2">Instructor payout and bank account management is coming soon. Revenue summaries are available on the Analytics page.</p>
        </Panel>

        <Panel title="Security">
          <div className="space-y-4">
            <FormField label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <FormField label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <FormField label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </Panel>

        <Button variant="primary" size="md" disabled={saving} onClick={handleSavePassword}>
          {saving ? 'Saving…' : 'Update password'}
        </Button>
      </div>
    </div>
  )
}
