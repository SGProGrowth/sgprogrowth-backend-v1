import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Container } from '../components/layout/Container'
import { SectionHeader } from '../components/layout/SectionHeader'
import { courseCategories as fallbackCategories } from '../data/homepageData'
import type { Course } from '../data/homepageData'
import { CourseCard } from '../components/ui/CourseCard'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { LoadingState } from '../components/ui/LoadingState'
import { RequestError } from '../components/ui/RequestError'
import { fetchCourseCatalog, mapCatalogCourseToUi } from '../lib/api/courses'
import { fetchCategories, mapCategoryToUi } from '../lib/api/categories'
import { getFriendlyErrorMessage } from '../lib/api/errors'

const PAGE_SIZE = 9

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const initialCategory = searchParams.get('category') ?? 'all'
  const initialSort = (searchParams.get('sort') as 'relevance' | 'rating' | 'duration') || 'relevance'

  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState<'relevance' | 'rating' | 'duration'>(initialSort)
  const [page, setPage] = useState(1)
  const [courses, setCourses] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState(fallbackCategories)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
      .then((rows) => setCategories(rows.map(mapCategoryToUi)))
      .catch(() => setCategories(fallbackCategories))
  }, [])

  useEffect(() => {
    setQuery(initialQuery)
    setCategory(initialCategory)
    setSort(initialSort)
    setPage(1)
  }, [initialQuery, initialCategory, initialSort])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCourseCatalog({
      page,
      pageSize: PAGE_SIZE,
      q: query.trim() || undefined,
      category: category !== 'all' ? category : undefined,
      sort: sort === 'duration' ? 'duration' : sort,
    })
      .then((res) => {
        if (!cancelled) {
          setCourses(res.data.map(mapCatalogCourseToUi))
          setTotal(res.meta.total)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, 'Unable to load courses.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, query, category, sort])

  const categoryOptions = useMemo(
    () => [{ id: 'all', title: 'All categories' }, ...categories.map((c) => ({ id: c.id, title: c.title }))],
    [categories],
  )

  const syncParams = (next: { q?: string; category?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams)
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q)
      else params.delete('q')
    }
    if (next.category !== undefined) {
      if (next.category && next.category !== 'all') params.set('category', next.category)
      else params.delete('category')
    }
    if (next.sort !== undefined) {
      if (next.sort && next.sort !== 'relevance') params.set('sort', next.sort)
      else params.delete('sort')
    }
    setSearchParams(params, { replace: true })
  }

  return (
    <section className="section-padding bg-white">
      <Container>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses' },
          ]}
        />

        <SectionHeader
          eyebrow="Course catalog"
          title="All courses"
          description="Search, filter, and sort expert-led programs with coaching support. Enroll through your organization or request a consultation."
          action={<Button to="/" variant="outline" size="sm">Back to home</Button>}
        />

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 max-w-xl">
            <label htmlFor="catalog-search" className="mb-1.5 block text-sm font-semibold text-ink">
              Search
            </label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
                syncParams({ q: e.target.value, page: 1 })
              }}
              placeholder="Search by title, instructor, or category"
              className="input-field w-full"
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:w-auto">
            <div>
              <label htmlFor="catalog-category" className="mb-1.5 block text-sm font-semibold text-ink">
                Category
              </label>
              <select
                id="catalog-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                  syncParams({ category: e.target.value, page: 1 })
                }}
                className="input-field w-full sm:min-w-[180px] appearance-none"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="catalog-sort" className="mb-1.5 block text-sm font-semibold text-ink">
                Sort by
              </label>
              <select
                id="catalog-sort"
                value={sort}
                onChange={(e) => {
                  const value = e.target.value as typeof sort
                  setSort(value)
                  setPage(1)
                  syncParams({ sort: value, page: 1 })
                }}
                className="input-field w-full sm:min-w-[180px] appearance-none"
              >
                <option value="relevance">Most relevant</option>
                <option value="rating">Top rated</option>
                <option value="duration">Shortest duration</option>
              </select>
            </div>
          </div>
        </div>

        <p className="mb-6 text-sm text-ink-3">
          {total} {total === 1 ? 'course' : 'courses'} found
          {query.trim() ? ` for “${query.trim()}”` : ''}
        </p>

        {loading ? (
          <LoadingState label="Loading courses…" />
        ) : error ? (
          <RequestError
            title="Unable to load courses"
            message={error}
            onRetry={() => {
              setError(null)
              setLoading(true)
              fetchCourseCatalog({
                page,
                pageSize: PAGE_SIZE,
                q: query.trim() || undefined,
                category: category !== 'all' ? category : undefined,
                sort: sort === 'duration' ? 'duration' : sort,
              })
                .then((res) => {
                  setCourses(res.data.map(mapCatalogCourseToUi))
                  setTotal(res.meta.total)
                  setError(null)
                })
                .catch((err) => setError(getFriendlyErrorMessage(err, 'Unable to load courses.')))
                .finally(() => setLoading(false))
            }}
          />
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-12 text-center">
            <p className="font-display text-lg font-bold text-ink">No courses match your filters</p>
            <p className="mt-2 text-sm text-ink-3">Try adjusting search terms or browse all categories.</p>
            <Button
              variant="secondary"
              size="md"
              className="mt-6"
              onClick={() => {
                setQuery('')
                setCategory('all')
                setSort('relevance')
                setPage(1)
                setSearchParams({}, { replace: true })
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            <Pagination
              className="mt-10"
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </Container>
    </section>
  )
}
