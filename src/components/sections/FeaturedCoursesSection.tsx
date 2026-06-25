import { useMemo, useState } from 'react'
import { featuredCourses, courseCategories } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { CourseCard } from '../ui/CourseCard'
import { FilterTabs } from '../ui/FilterTabs'
import { Button } from '../ui/Button'

const tabs = ['Most Popular', 'New', 'Trending', 'For Teams']

function filterTab(courses: typeof featuredCourses, tab: string) {
  if (tab === 'New') return courses.filter((c) => c.isNew)
  if (tab === 'Trending') return courses.filter((c) => c.trending)
  if (tab === 'For Teams') return courses.filter((c) => c.forTeams)
  return courses
}

export function FeaturedCoursesSection() {
  const [tab, setTab] = useState(tabs[0])
  const [cat, setCat] = useState('all')

  const courses = useMemo(() => {
    let r = filterTab(featuredCourses, tab)
    if (cat !== 'all') r = r.filter((c) => c.category === cat)
    return r.length ? r : featuredCourses
  }, [tab, cat])

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
            {courseCategories.map((c) => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </Container>
    </section>
  )
}
