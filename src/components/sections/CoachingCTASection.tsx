import { Container } from '../layout/Container'
import { Button } from '../ui/Button'
import { DemoRequestForm } from '../ui/DemoRequestForm'
import { trackEvent } from '../../lib/analytics'
import { useState } from 'react'

export function CoachingCTASection() {
  const [showForm, setShowForm] = useState(false)

  return (
    <section className="bg-navy-900">
      <Container className="py-12 md:py-14">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-label mb-2 text-brand-200">Free consultation</p>
            <h2 className="text-display-md text-white">
              Not sure where to start? Get a personalised coaching session first.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
              Speak with a career coach before enrolling. We&apos;ll map your goals to
              the right certifications—no generic course recommendations.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              href="#"
              variant="secondary"
              size="lg"
              className="whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault()
                trackEvent('cta_book_session_clicked')
                setShowForm((s) => !s)
              }}
            >
              Book free session
            </Button>
            <Button
              href="#how-it-works"
              variant="secondary"
              size="lg"
              onClick={() => trackEvent('cta_see_how_it_works_clicked')}
            >
              See how it works
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mt-6 max-w-2xl">
            <DemoRequestForm onClose={() => setShowForm(false)} />
          </div>
        )}
      </Container>
    </section>
  )
}
