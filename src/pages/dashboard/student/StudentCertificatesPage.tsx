import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMyCertificates, type CertificateRecord } from '../../../lib/api/certificates'
import { AchievementTimeline, CertificateCard } from '../../../components/student/CertificateCard'
import { PageIntro, EmptyState, Panel } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { RequestError } from '../../../components/ui/RequestError'
import { getFriendlyErrorMessage } from '../../../lib/api/errors'

export function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchMyCertificates()
      setCertificates(rows)
    } catch (err) {
      setCertificates([])
      setError(getFriendlyErrorMessage(err, 'Unable to load certificates.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
        <LoadingState label="Loading certificates…" />
      ) : error ? (
        <RequestError title="Unable to load certificates" message={error} onRetry={() => void load()} />
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
