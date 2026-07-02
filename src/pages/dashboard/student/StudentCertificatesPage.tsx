import { useEffect, useMemo, useState } from 'react'
import { fetchMyCertificates, type CertificateRecord } from '../../../lib/api/certificates'
import { AchievementTimeline, CertificateCard } from '../../../components/student/CertificateCard'
import { PageIntro, EmptyState, Panel } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'

export function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchMyCertificates()
      .then(setCertificates)
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false))
  }, [])

  const timeline = useMemo(
    () =>
      certificates.map((c) => ({
        date: c.issuedDate,
        event: `${c.courseTitle} certificate earned`,
        type: 'certificate' as const,
      })),
    [certificates],
  )

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Achievements"
        title="Certificates"
        description="Credentials you've earned through guided learning — download, verify, and share your accomplishments."
      />

      {loading ? (
        <p className="text-sm text-ink-3 py-12 text-center">Loading certificates…</p>
      ) : certificates.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
          <Panel title="Achievement timeline" className="lg:col-span-2">
            <AchievementTimeline events={timeline} />
          </Panel>
        </div>
      ) : (
        <EmptyState
          title="No certificates yet"
          description="Complete a program to earn your first credential. Your coach will guide you through certification milestones."
          action={<Button to="/dashboard/courses" variant="primary" size="md">View my courses</Button>}
        />
      )}
    </div>
  )
}
