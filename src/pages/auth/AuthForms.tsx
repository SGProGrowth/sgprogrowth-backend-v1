import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { getDashboardBasePath } from '../../data/dashboardData'
import { ApiError } from '../../lib/api/errors'
import { isSafeRedirectPath } from '../../lib/api/client'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'

interface AuthLocationState {
  from?: string
  registered?: boolean
  email?: string
}

interface SignInPageProps {
  role: UserRole
}

export function SignInPage({ role }: SignInPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as AuthLocationState | null
  const { signIn } = useAuth()
  const [email, setEmail] = useState(locationState?.email ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const registered = locationState?.registered === true

  const roleLabel = role === 'student' ? 'Student' : 'Instructor'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password, role)
      const redirectTo = locationState?.from
      const safeRedirect = isSafeRedirectPath(redirectTo)
        ? redirectTo
        : getDashboardBasePath(role)
      navigate(safeRedirect, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(err.message)
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={`Sign in as ${roleLabel}`}
      subtitle={`Access your ${role === 'student' ? 'learning dashboard' : 'instructor portal'}.`}
      backHref="/login"
      backLabel="Choose different role"
    >
      {registered && (
        <p className="mb-5 rounded-md border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          Your account was created successfully. Verify your email, then sign in to continue.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="input-field w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-ink">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-forest-800 hover:text-forest-900">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="input-field w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
            {error.toLowerCase().includes('verify') && (
              <Link
                to={`/resend-verification?email=${encodeURIComponent(email.trim())}`}
                className="mt-2 inline-block font-semibold text-forest-800 hover:text-forest-900"
              >
                Resend verification email
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in…' : `Sign in as ${roleLabel}`}
        </Button>

        <p className="text-center text-xs text-ink-3">
          Secure sign-in powered by SG Pro Growth identity services.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-ink-3">
        New to SG Pro Growth?{' '}
        <Link to={`/register/${role}`} className="font-semibold text-forest-800 hover:text-forest-900">
          Register as {roleLabel}
        </Link>
      </p>
    </AuthLayout>
  )
}

interface RegisterPageProps {
  role: UserRole
}

export function RegisterPage({ role }: RegisterPageProps) {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roleLabel = role === 'student' ? 'Student' : 'Instructor'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const result = await register(name, email, password, role)
      if (result.requiresVerification) {
        navigate(`/check-email?email=${encodeURIComponent(result.email)}&role=${result.role}`, { replace: true })
      } else {
        navigate(`/login/${result.role}`, {
          replace: true,
          state: { registered: true, email: result.email },
        })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={`Register as ${roleLabel}`}
      subtitle={
        role === 'student'
          ? 'Start your coaching-led learning journey with a free account.'
          : 'Join our instructor network and start teaching with purpose.'
      }
      backHref="/register"
      backLabel="Choose different role"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="input-field w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="input-field w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="input-field w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button
          type="submit"
          variant={role === 'student' ? 'gold' : 'primary'}
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account…' : `Create ${roleLabel} account`}
        </Button>

        <p className="text-xs text-ink-3 leading-relaxed">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-ink-3">
        Already have an account?{' '}
        <Link to={`/login/${role}`} className="font-semibold text-forest-800 hover:text-forest-900">
          Sign in as {roleLabel}
        </Link>
      </p>
    </AuthLayout>
  )
}
