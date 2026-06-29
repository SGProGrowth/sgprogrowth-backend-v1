import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { PageIntro, Panel, EmptyState } from '../../../components/dashboard/PageShell'
import { Button } from '../../../components/ui/Button'

interface DownloadItem {
  id: string
  title: string
  courseTitle: string
  type: 'pdf' | 'video' | 'resource' | 'slides'
  size: string
  updatedAt: string
}

const downloadTypeLabels: Record<DownloadItem['type'], string> = {
  pdf: 'PDF',
  video: 'Video',
  resource: 'Resource pack',
  slides: 'Slides',
}

export function StudentDownloadsPage() {
  const { workspace } = useStudentDashboard()
  const courses = workspace?.courses ?? []

  const downloads: DownloadItem[] = courses.flatMap((course) => [
    {
      id: `${course.id}-guide`,
      title: `${course.title} — Study guide`,
      courseTitle: course.title,
      type: 'pdf' as const,
      size: '2.4 MB',
      updatedAt: course.lastAccessed,
    },
    {
      id: `${course.id}-resources`,
      title: `${course.title} — Module resources`,
      courseTitle: course.title,
      type: 'resource' as const,
      size: '18 MB',
      updatedAt: course.lastAccessed,
    },
  ])

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Resources"
        title="Downloads"
        description="Course materials, study guides, and resources available for your enrolled programs."
      />

      {downloads.length === 0 ? (
        <EmptyState
          title="No downloads available"
          description="Enroll in a course to access downloadable materials and resources."
        />
      ) : (
        <Panel title="Available materials">
          <ul className="divide-y divide-stone-100">
            {downloads.map((item) => (
              <li key={item.id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {downloadTypeLabels[item.type]} · {item.size} · Updated {item.updatedAt}
                  </p>
                </div>
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  Download
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
