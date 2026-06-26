import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Rating } from '../components/ui/Rating'
import { featuredCourses } from '../data/homepageData'

const learningOutcomes: Record<string, string[]> = {
  default: [
    'Apply skills through guided projects and real-world scenarios',
    'Receive 1:1 coaching and accountability from certified instructors',
    'Prepare for industry certifications with structured milestones',
    'Build a portfolio of work aligned to employer expectations',
  ],
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const course = featuredCourses.find((c) => c.id === id)

  if (!course) {
    return (
      <section className="section-padding">
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Courses', href: '/courses' }, { label: 'Not found' }]} />
          <h1 className="text-display-md text-ink">Course not found</h1>
          <p className="mt-3 text-body-lg">We couldn&apos;t find the course you requested. It may have been archived or renamed.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/courses" variant="primary" size="md">Browse all courses</Button>
            <Button to="/register" variant="secondary" size="md">Create an account</Button>
          </div>
        </Container>
      </section>
    )
  }

  const outcomes = learningOutcomes[course.id] ?? learningOutcomes.default

  return (
    <section className="section-padding bg-white">
      <Container>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course.title },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-label mb-2">{course.category}</p>
            <h1 className="text-display-lg text-ink">{course.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-3">
              <Rating rating={course.rating} reviewCount={course.reviewCount} />
              <span aria-hidden="true">·</span>
              <span>{course.level}</span>
              <span aria-hidden="true">·</span>
              <span>{course.duration}</span>
              {course.learners && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{course.learners} learners</span>
                </>
              )}
            </div>

            <p className="mt-6 text-body-lg">
              Led by{' '}
              <a
                href={course.instructorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-forest-800 hover:text-forest-900 transition-colors"
              >
                {course.instructor}
              </a>
              . This program combines structured learning paths with live coaching sessions designed for measurable career outcomes.
            </p>

            <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6">
              <h2 className="font-display text-base font-bold text-ink">About this program</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                {course.forTeams
                  ? 'Built for teams and cohorts with private coaching, progress tracking, and enterprise reporting.'
                  : 'Includes self-paced modules, weekly coaching check-ins, assignments with instructor feedback, and certification prep resources.'}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/register" variant="primary" size="lg">
                {course.price ? 'Enroll now' : course.ctaLabel}
              </Button>
              <Button to="/login" variant="secondary" size="md">
                Sign in to continue
              </Button>
              <Button to="/courses" variant="ghost" size="md">
                Back to catalog
              </Button>
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(10,10,10,0.04)] lg:sticky lg:top-24">
            {course.price && (
              <p className="text-display-md text-ink">{course.price}</p>
            )}
            {!course.price && (
              <p className="text-sm font-semibold text-forest-800">Free consultation included</p>
            )}

            <ul className="mt-6 space-y-3 border-t border-stone-100 pt-6">
              <li className="flex justify-between text-sm">
                <span className="text-ink-3">Duration</span>
                <span className="font-semibold text-ink">{course.duration}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-ink-3">Level</span>
                <span className="font-semibold text-ink">{course.level}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-ink-3">Format</span>
                <span className="font-semibold text-ink">Coaching + self-paced</span>
              </li>
              {course.badge && (
                <li className="flex justify-between text-sm">
                  <span className="text-ink-3">Access</span>
                  <span className="font-semibold text-ink">{course.badge}</span>
                </li>
              )}
            </ul>

            <h3 className="mt-8 font-display text-sm font-bold text-ink">What you&apos;ll learn</h3>
            <ul className="mt-3 space-y-2.5">
              {outcomes.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-ink-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-ink-4">
              Questions?{' '}
              <Link to="/#contact" className="font-semibold text-forest-800 hover:text-forest-900">
                Contact our team
              </Link>
            </p>
          </aside>
        </div>
      </Container>
    </section>
  )
}
