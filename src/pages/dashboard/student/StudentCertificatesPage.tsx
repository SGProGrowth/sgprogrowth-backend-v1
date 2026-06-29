import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { certificateTimeline } from '../../../data/studentData'
import { AchievementTimeline, CertificateCard } from '../../../components/student/CertificateCard'
import { PageIntro, EmptyState, Panel } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'

export function StudentCertificatesPage() {
  const { workspace } = useStudentDashboard()
  const earnedCertificates = workspace?.certificates ?? []

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Achievements"
        title="Certificates"
        description="Credentials you've earned through guided learning — download, verify, and share your accomplishments."
      />

      {earnedCertificates.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            {earnedCertificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
          <Panel title="Achievement timeline" className="lg:col-span-2">
            <AchievementTimeline events={certificateTimeline} />
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
