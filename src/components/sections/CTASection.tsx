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

          <form
            id="signup"
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              required
              placeholder="Work email address"
              className="input-field sm:max-w-xs flex-1"
            />
            <Button type="submit" variant="gold" size="lg" className="shrink-0">
              Get started free
            </Button>
          </form>

          <p className="mt-5 text-xs text-ink-4">
            Free 30-minute consultation · No credit card · 500+ learners guided
          </p>
          <div className="mt-6">
            <Button href="mailto:sales@sharvagroup.com" variant="ghost" size="md">
              Or email sales@sharvagroup.com →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
