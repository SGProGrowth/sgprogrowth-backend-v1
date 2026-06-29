import { useMemo, useState } from 'react'
import { recommendedCourses } from '../../../data/studentData'
import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { EnrolledCourseCard, RecommendedCourseCard } from '../../../components/student/CourseCards'
import { PageIntro, TabBar, EmptyState } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'
import { Pagination, usePagination } from '../../../components/ui/Pagination'

const PAGE_SIZE = 6

export function StudentCoursesPage() {
  const { workspace } = useStudentDashboard()
  const [tab, setTab] = useState('active')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const active = workspace?.courses.filter((c) => c.status === 'active') ?? []
  const completed = workspace?.courses.filter((c) => c.status === 'completed') ?? []

  const tabs = [
    { id: 'active', label: 'Active', count: active.length },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'recommended', label: 'Recommended', count: recommendedCourses.length },
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
    if (!query.trim()) return recommendedCourses
    const q = query.toLowerCase()
    return recommendedCourses.filter((c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q))
  }, [query])

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

      {filtered.length === 0 ? (
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
