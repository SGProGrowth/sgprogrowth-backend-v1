import { useMemo, useState } from 'react'
import { Container } from '../components/layout/Container'
import { SectionHeader } from '../components/layout/SectionHeader'
import { featuredCourses, courseCategories } from '../data/homepageData'
import { CourseCard } from '../components/ui/CourseCard'
import { Button } from '../components/ui/Button'

export default function CoursesPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<'relevance' | 'rating' | 'duration'>('relevance')
  const [visible, setVisible] = useState(6)

  const categories = [{ id: 'all', title: 'All' }, ...courseCategories]

  const filtered = useMemo(() => {
    let list = featuredCourses.slice()

    if (category !== 'all') {
      list = list.filter((c) => c.category?.toLowerCase().includes((category as string).toLowerCase()))
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q))
    }

    if (sort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sort === 'duration') {
      // crude duration sort by numeric prefix where present
      const parseDur = (d = '') => parseInt(d, 10) || 0
      list.sort((a, b) => parseDur(a.duration) - parseDur(b.duration))
    }

    return list
  }, [query, category, sort])

  return (
    <main>
      <section className="section-padding bg-white">
        <Container>
          <SectionHeader
            eyebrow="Courses"
            title="All Courses"
            description="Search, filter, and sort our course catalog. Click any course to view details or contact the instructor for enrolment."
            action={<Button href="#top" variant="outline" size="sm">Back to home</Button>}
          />

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-center gap-3 sm:w-1/2">
              <label htmlFor="search" className="sr-only">Search courses</label>
              <input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by course title or instructor"
                className="input-default w-full"
              />
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-default appearance-none"
              >
                {categories.map((cat) => (
                  <option key={(cat as any).id || cat.id} value={(cat as any).id || cat.id}>
                    {(cat as any).title || cat.title}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="input-default appearance-none"
              >
                <option value="relevance">Most relevant</option>
                <option value="rating">Top rated</option>
                <option value="duration">Shortest duration</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && (
              <p className="text-sm text-slate-600">No courses match your search.</p>
            )}

            {filtered.slice(0, visible).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-6 text-center">
              <Button variant="ghost" size="md" onClick={() => setVisible((v) => v + 6)}>
                Load more
              </Button>
            </div>
          )}
        </Container>
      </section>
    </main>
  )
}
