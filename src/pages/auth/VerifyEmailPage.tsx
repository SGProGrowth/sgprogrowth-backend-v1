import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailToken } from '../../lib/api/auth'
import { getErrorMessage } from '../../lib/api/errors'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(
    token ? '' : 'This verification link is invalid. Request a new one below.',
  )
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) return

    verifyEmailToken(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.message)
        if (res.email) setEmail(res.email)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Unable to verify your email.'))
      })
  }, [token])

  if (status === 'loading') {
    return (
      <AuthLayout title="Verifying email" subtitle="Please wait while we confirm your address.">
        <LoadingState label="Verifying your email…" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={status === 'success' ? 'Email verified' : 'Verification failed'}
      subtitle={status === 'success' ? 'Your account is ready to use.' : 'We could not verify this link.'}
      backHref="/login"
      backLabel="Back to sign in"
    >
      <p
        className={`rounded-md px-4 py-3 text-sm ${
          status === 'success'
            ? 'border border-forest-200 bg-forest-50 text-forest-900'
            : 'border border-red-200 bg-red-50 text-red-700'
        }`}
      >
        {message}
      </p>

      <div className="mt-6 space-y-3">
        {status === 'success' ? (
          <>
            <Button to="/login/student" variant="primary" size="lg" className="w-full">
              Sign in as Student
            </Button>
            <Button to="/login/instructor" variant="secondary" size="lg" className="w-full">
              Sign in as Instructor
            </Button>
          </>
        ) : (
          <>
            <Button
              to="/resend-verification"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Resend verification email
            </Button>
            {email && (
              <Button
                to={`/resend-verification?email=${encodeURIComponent(email)}`}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Resend to {email}
              </Button>
            )}
            <Link to="/login" className="block text-center text-sm font-semibold text-forest-800 hover:text-forest-900">
              Return to sign in
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
