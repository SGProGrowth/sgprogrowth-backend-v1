import { Link } from 'react-router-dom'
import { Container } from '../layout/Container'
import { Button } from '../ui/Button'

export function CTASection() {
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

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button to="/register/student" variant="gold" size="lg">
              Create your free account
            </Button>
            <Button href="mailto:contact@sgprogrowth.com" variant="secondary" size="lg">
              Email our team
            </Button>
          </div>

          <p className="mt-5 text-xs text-ink-4">
            Free 30-minute consultation · No credit card required
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link to="/register" className="text-sm font-semibold text-forest-800 hover:text-forest-900">
              Create an account →
            </Link>
            <Link to="/courses" className="text-sm font-semibold text-forest-800 hover:text-forest-900">
              Browse programs →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
