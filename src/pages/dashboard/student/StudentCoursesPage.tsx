import { useEffect, useMemo, useState } from 'react'
import { useStudentDashboard } from '../../../contexts/DashboardWorkspaceContext'
import { EnrolledCourseCard, RecommendedCourseCard } from '../../../components/student/CourseCards'
import { PageIntro, TabBar, EmptyState } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'
import { Pagination, usePagination } from '../../../components/ui/Pagination'
import { LoadingState } from '../../../components/ui/LoadingState'
import { fetchCourseCatalog } from '../../../lib/api/courses'
import { mapCatalogToRecommended } from '../../../lib/api/enrollments'

const PAGE_SIZE = 6

export function StudentCoursesPage() {
  const { workspace } = useStudentDashboard()
  const [tab, setTab] = useState('active')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [recommended, setRecommended] = useState<ReturnType<typeof mapCatalogToRecommended>[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)

  const active = workspace?.courses.filter((c) => c.status === 'active') ?? []
  const completed = workspace?.courses.filter((c) => c.status === 'completed') ?? []
  const enrolledIdKey = workspace?.courses.map((c) => c.id).join(',') ?? ''

  useEffect(() => {
    if (tab !== 'recommended') return

    let cancelled = false
    setLoadingRecommended(true)
    const enrolled = new Set(enrolledIdKey ? enrolledIdKey.split(',') : [])

    fetchCourseCatalog({ page: 1, pageSize: 20, sort: 'rating' })
      .then((res) => {
        if (cancelled) return
        const items = res.data
          .filter((c) => !enrolled.has(c.id))
          .slice(0, 6)
          .map((c, i) =>
            mapCatalogToRecommended(
              {
                id: c.id,
                title: c.title,
                instructor: c.instructor,
                category: c.category,
                level: c.level,
                duration: c.duration,
                rating: c.rating,
                reviewCount: c.reviewCount,
                price: c.price,
                badge: c.badge,
              },
              i === 0 ? 'Top rated in catalog' : 'Recommended for your learning path',
            ),
          )
        setRecommended(items)
      })
      .catch(() => {
        if (!cancelled) setRecommended([])
      })
      .finally(() => {
        if (!cancelled) setLoadingRecommended(false)
      })

    return () => {
      cancelled = true
    }
  }, [tab, enrolledIdKey])

  const tabs = [
    { id: 'active', label: 'Active', count: active.length },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'recommended', label: 'Recommended', count: recommended.length },
  ]

  const filteredActive = useMemo(() => {
    if (!query.trim()) return active
    const q = query.toLowerCase()
    return active.filter((c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q))
  }, [active, query])

  const filteredCompleted = useMemo(() => {
    if (!query.trim()) return completed
    const q = query.toLowerCase()
    return completed.filter((c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q))
  }, [completed, query])

  const filteredRecommended = useMemo(() => {
    if (!query.trim()) return recommended
    const q = query.toLowerCase()
    return recommended.filter((c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q))
  }, [query, recommended])

  const filtered =
    tab === 'active' ? filteredActive : tab === 'completed' ? filteredCompleted : filteredRecommended

  const pagedActive = usePagination(filteredActive, PAGE_SIZE, page)
  const pagedCompleted = usePagination(filteredCompleted, PAGE_SIZE, page)
  const pagedRecommended = usePagination(filteredRecommended, PAGE_SIZE, page)

  const handleTabChange = (id: string) => {
    setTab(id)
    setPage(1)
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="My learning"
        title="My Courses"
        description="Track active enrollments, review completed programs, and explore coach-recommended courses aligned with your career goals."
        action={<Button to="/courses" variant="secondary" size="md">Browse full catalog</Button>}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <TabBar tabs={tabs} active={tab} onChange={handleTabChange} className="mb-0 flex-1" />
        <div className="w-full lg:max-w-xs">
          <label htmlFor="student-course-search" className="mb-1.5 block text-sm font-semibold text-ink">
            Search courses
          </label>
          <input
            id="student-course-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Filter by title or instructor"
            className="input-field w-full"
          />
        </div>
      </div>

      {tab === 'recommended' && loadingRecommended ? (
        <LoadingState label="Loading recommendations…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? 'No matching courses' : 'No courses in this view'}
          description={query ? 'Try a different search term or switch tabs.' : 'Browse the catalog to enroll in your next program.'}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {tab === 'active' && pagedActive.map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))}
            {tab === 'completed' && pagedCompleted.map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))}
            {tab === 'recommended' && pagedRecommended.map((course) => (
              <RecommendedCourseCard key={course.id} course={course} />
            ))}
          </div>
          <Pagination
            className="mt-8"
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
