import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchDevAuthToken } from '../../lib/api/auth'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'

const isDev = import.meta.env.DEV

export function CheckEmailPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? 'your email address'
  const role = params.get('role') === 'instructor' ? 'instructor' : 'student'
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isDev || !email || email === 'your email address') return

    let cancelled = false
    const normalizedEmail = email.trim().toLowerCase()

    async function loadDevLink() {
      for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
        try {
          const { token } = await fetchDevAuthToken(normalizedEmail, 'verify')
          if (!cancelled && token) {
            setDevVerifyUrl(`/verify-email?token=${encodeURIComponent(token)}`)
            return
          }
        } catch {
          // Token not ready yet — registration may still be processing
        }
      }
    }

    void loadDevLink()
    return () => {
      cancelled = true
    }
  }, [email])

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

      {devVerifyUrl && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-semibold">Local development shortcut</p>
          <p className="mt-1">
            Email delivery uses a test SMTP inbox in development. You can verify immediately with this
            link:
          </p>
          <Link
            to={devVerifyUrl}
            className="mt-2 inline-block break-all font-semibold text-forest-800 hover:text-forest-900"
          >
            Verify email now
          </Link>
        </div>
      )}

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
