import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'

export function CheckEmailPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? 'your email address'
  const role = params.get('role') === 'instructor' ? 'instructor' : 'student'

  return (
    <AuthLayout
      title="Check your email"
      subtitle="We sent a verification link to complete your registration."
      backHref={`/register/${role}`}
      backLabel="Back to registration"
    >
      <div className="rounded-md border border-forest-200 bg-forest-50 px-4 py-4 text-sm text-forest-900">
        <p>
          A verification email was sent to <span className="font-semibold">{email}</span>.
        </p>
        <p className="mt-2">
          Open the link in that email to verify your account, then sign in to access your dashboard.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Button to={`/login/${role}`} variant="primary" size="lg" className="w-full">
          Go to sign in
        </Button>
        <p className="text-center text-sm text-ink-3">
          Didn&apos;t receive it?{' '}
          <Link to={`/resend-verification?email=${encodeURIComponent(email)}`} className="font-semibold text-forest-800 hover:text-forest-900">
            Resend verification email
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
