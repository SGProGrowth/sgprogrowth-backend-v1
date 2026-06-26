import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-lg px-4 text-center">
        <p className="text-label mb-3">404</p>
        <h1 className="text-display-lg text-ink">Page not found</h1>
        <p className="mt-4 text-body-lg">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/" variant="primary" size="md">Back to homepage</Button>
          <Button to="/courses" variant="secondary" size="md">Browse courses</Button>
          <Link to="/login" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-forest-800 hover:text-forest-900">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}
