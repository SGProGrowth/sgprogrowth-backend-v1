import { certificateTimeline, earnedCertificates } from '../../../data/studentData'
import { AchievementTimeline, CertificateCard } from '../../../components/student/CertificateCard'
import { PageIntro, EmptyState, Panel } from '../../../components/student/Panel'

export function StudentCertificatesPage() {
  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Achievements"
        title="Certificates"
        description="Credentials you've earned through guided learning — download, verify, and share your accomplishments."
      />

      {earnedCertificates.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            {earnedCertificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}

            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-6 text-center">
              <p className="text-sm font-semibold text-ink-2">AWS Solutions Architect certificate</p>
              <p className="mt-1 text-sm text-ink-3">
                In progress — target completion Sep 2026 after exam prep and coaching review.
              </p>
            </div>
          </div>

          <Panel title="Achievement timeline" className="lg:col-span-2">
            <AchievementTimeline events={certificateTimeline} />
          </Panel>
        </div>
      ) : (
        <EmptyState
          title="No certificates yet"
          description="Complete a course to earn your first credential. Your coach will guide you through certification-ready programs."
        />
      )}
    </div>
  )
}
