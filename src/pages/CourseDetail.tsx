import { useMemo } from 'react'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { featuredCourses } from '../data/homepageData'

export default function CourseDetail() {
  const path = typeof window !== 'undefined' ? window.location.pathname : ''
  const id = path.split('/').pop() || ''

  const course = useMemo(() => featuredCourses.find((c) => c.id === id), [id])

  if (!course) {
    return (
      <main>
        <Container className="py-20">
          <h2 className="text-display-md">Course not found</h2>
          <p className="mt-3 text-slate-600">We couldn't find the requested course.</p>
          <div className="mt-6">
            <Button href="/courses" variant="outline" size="md">Back to courses</Button>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main>
      <Container className="py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-label mb-2">{course.category}</p>
            <h1 className="text-display-lg">{course.title}</h1>
            <p className="mt-3 text-body-lg text-slate-600">Instructor: <a href={course.instructorUrl} className="font-medium text-brand-600">{course.instructor}</a></p>

            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-700">Level: {course.level}</p>
              <p className="text-sm text-slate-700">Duration: {course.duration}</p>
              {course.learners && <p className="text-sm text-slate-700">Learners: {course.learners}</p>}
              <p className="text-sm text-slate-700">Reviews: {course.reviewCount} · Rating: {course.rating}</p>

              <div className="mt-6">
                <Button href={course.instructorUrl} variant="secondary" size="lg">{course.ctaLabel}</Button>
                <Button href="/courses" variant="ghost" size="md" className="ml-3">Back to courses</Button>
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-surface p-6">
            <h3 className="text-sm font-semibold text-navy-900">What you'll learn</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Practical skills aligned to real projects</li>
              <li>Mentoring and accountability</li>
              <li>Certification preparation</li>
            </ul>
          </aside>
        </div>
      </Container>
    </main>
  )
}
