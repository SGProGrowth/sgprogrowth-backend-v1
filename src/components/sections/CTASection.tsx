import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../layout/Container'
import { Button } from '../ui/Button'

export function CTASection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid work email address.')
      return
    }
    setSubmitted(true)
  }

  return (
    <section id="contact" className="section-padding bg-white section-rule">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-display-lg text-ink">
            Get the right guidance — not just another course
          </h2>
          <p className="mt-4 text-body-lg mx-auto">
            Start with a free coaching session. Discover the certifications and skills
            aligned to your career goals.
          </p>

          {submitted ? (
            <div className="mt-10 rounded-xl border border-forest-200 bg-forest-50 px-6 py-8 text-left sm:text-center" role="status">
              <p className="font-display text-lg font-bold text-forest-900">You&apos;re on the list</p>
              <p className="mt-2 text-sm text-ink-2">
                Our coaching team will reach out to <span className="font-semibold text-ink">{email}</span> within one business day to schedule your consultation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 sm:justify-center">
                <Button to="/register" variant="primary" size="md">Create your account</Button>
                <Button to="/courses" variant="secondary" size="md">Browse programs</Button>
              </div>
            </div>
          ) : (
            <form
              id="signup"
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="flex flex-1 flex-col gap-1.5 sm:max-w-md">
                <label htmlFor="cta-email" className="sr-only">Work email</label>
                <input
                  id="cta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email address"
                  className={`input-field w-full ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'cta-email-error' : undefined}
                />
                {error && (
                  <p id="cta-email-error" className="text-left text-xs font-medium text-red-600 sm:text-center">
                    {error}
                  </p>
                )}
              </div>
              <Button type="submit" variant="gold" size="lg" className="shrink-0">
                Get started free
              </Button>
            </form>
          )}

          <p className="mt-5 text-xs text-ink-4">
            Free 30-minute consultation · No credit card · 500+ learners guided
          </p>
          <div className="mt-6">
            <Link to="/register" className="text-sm font-semibold text-forest-800 hover:text-forest-900 mr-4">
              Create an account →
            </Link>
            <Button href="mailto:sales@sharvagroup.com" variant="ghost" size="md">
              Email sales@sharvagroup.com
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
