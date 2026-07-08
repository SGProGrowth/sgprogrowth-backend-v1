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
        <div className="mt-8 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
          <Button to="/" variant="primary" size="md">Back to homepage</Button>
          <Button to="/courses" variant="secondary" size="md">Browse courses</Button>
          <Button to="/login" variant="ghost" size="md">Sign in</Button>
        </div>
      </div>
    </section>
  )
}
