import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchDevAuthToken, resendVerificationEmail, requestPasswordReset, resetPassword } from '../../lib/api/auth'
import { getErrorMessage } from '../../lib/api/errors'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'

export function ResendVerificationPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    try {
      const res = await resendVerificationEmail(email.trim())
      setMessage(res.message)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Resend verification"
      subtitle="Enter your email and we'll send a new verification link."
      backHref="/login"
      backLabel="Back to sign in"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input-field w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {message && (
          <p className="rounded-md border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-900">{message}</p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send verification email'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-3">
        Already verified?{' '}
        <Link to="/login" className="font-semibold text-forest-800 hover:text-forest-900">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setDevResetUrl(null)
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    try {
      const res = await requestPasswordReset(email.trim())
      setMessage(res.message)
      if (import.meta.env.DEV) {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
          try {
            const { token } = await fetchDevAuthToken(email.trim().toLowerCase(), 'reset')
            if (token) {
              setDevResetUrl(`/reset-password?token=${encodeURIComponent(token)}`)
              break
            }
          } catch {
            // Token not ready yet
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your account email and we'll send reset instructions."
      backHref="/login"
      backLabel="Back to sign in"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            className="input-field w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {message && (
          <div className="space-y-3">
            <p className="rounded-md border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-900">{message}</p>
            {devResetUrl && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <span className="font-semibold">Local development shortcut: </span>
                <Link to={devResetUrl} className="font-semibold text-forest-800 hover:text-forest-900">
                  Reset password now
                </Link>
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!token) {
      setError('This reset link is invalid.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await resetPassword({ token, password })
      setMessage(res.message)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account."
      backHref="/login"
      backLabel="Back to sign in"
    >
      {message ? (
        <div className="space-y-4">
          <p className="rounded-md border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-900">{message}</p>
          <Button to="/login" variant="primary" size="lg" className="w-full">
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="input-field w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-ink">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="input-field w-full"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
