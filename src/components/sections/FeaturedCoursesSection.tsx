import { useEffect, useMemo, useState } from 'react'
import { courseCategories as fallbackCategories } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { CourseCard } from '../ui/CourseCard'
import { FilterTabs } from '../ui/FilterTabs'
import { Button } from '../ui/Button'
import { LoadingState } from '../ui/LoadingState'
import { fetchCourseCatalog, mapCatalogCourseToUi } from '../../lib/api/courses'
import { fetchCategories, mapCategoryToUi } from '../../lib/api/categories'

const tabs = ['Most Popular', 'New', 'Trending', 'For Teams']

export function FeaturedCoursesSection() {
  const [tab, setTab] = useState(tabs[0])
  const [cat, setCat] = useState('all')
  const [courses, setCourses] = useState<ReturnType<typeof mapCatalogCourseToUi>[]>([])
  const [categories, setCategories] = useState(fallbackCategories)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
      .then((rows) => setCategories(rows.map(mapCategoryToUi)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const params: Parameters<typeof fetchCourseCatalog>[0] = {
      page: 1,
      pageSize: 12,
      featured: tab === 'Most Popular' ? true : undefined,
      trending: tab === 'Trending' ? true : undefined,
      forTeams: tab === 'For Teams' ? true : undefined,
    }

    fetchCourseCatalog(params)
      .then((res) => {
        if (!cancelled) setCourses(res.data.map(mapCatalogCourseToUi))
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tab])

  const filtered = useMemo(() => {
    let list = courses.slice()
    if (tab === 'New') list = list.filter((c) => c.isNew)
    if (cat !== 'all') list = list.filter((c) => c.category === cat)
    return list.length ? list : courses
  }, [courses, tab, cat])

  return (
    <section id="courses" className="section-padding bg-white section-rule">
      <Container>
        <SectionHeader
          eyebrow="Featured programs"
          title="Courses designed for career outcomes"
          description="Expert-led programs with coaching guidance, clear milestones, and credentials that employers recognize."
          action={<Button href="/courses" variant="outline" size="md">View catalog</Button>}
        />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs tabs={tabs} activeTab={tab} onChange={setTab} />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="input-field w-full sm:w-auto sm:min-w-[180px]"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingState label="Loading featured courses…" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </Container>
    </section>
  )
}
