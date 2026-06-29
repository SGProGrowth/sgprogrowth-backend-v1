import { Link } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'

const roleCards = [
  {
    role: 'student' as const,
    title: 'Student',
    description: 'Access your courses, coaching sessions, career roadmap, and certifications.',
    href: '/login/student',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    role: 'instructor' as const,
    title: 'Instructor',
    description: 'Manage courses, coach learners, track analytics, and grow your teaching practice.',
    href: '/login/instructor',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
]

export function LoginLandingPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Choose your role to access your account."
    >
      <div className="space-y-3">
        {roleCards.map((card) => (
          <Link
            key={card.role}
            to={card.href}
            className="group flex items-start gap-4 rounded-lg border border-stone-200 bg-white p-5 transition-all hover:border-forest-600 hover:shadow-[0_4px_24px_-4px_rgba(10,10,10,0.08)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700 group-hover:bg-forest-800 group-hover:text-white transition-colors">
              {card.icon}
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">Sign in as {card.title}</p>
              <p className="mt-1 text-sm text-ink-3">{card.description}</p>
            </div>
            <svg
              className="ml-auto mt-1 h-5 w-5 shrink-0 text-ink-4 group-hover:text-forest-700 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-3">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-forest-800 hover:text-forest-900">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  )
}

export function RegisterLandingPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="New to SG Pro Growth? Choose how you'll use the platform."
    >
      <div className="space-y-3">
        {roleCards.map((card) => (
          <Link
            key={card.role}
            to={`/register/${card.role}`}
            className="group flex items-start gap-4 rounded-lg border border-stone-200 bg-white p-5 transition-all hover:border-forest-600 hover:shadow-[0_4px_24px_-4px_rgba(10,10,10,0.08)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-colors">
              {card.icon}
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">Register as {card.title}</p>
              <p className="mt-1 text-sm text-ink-3">{card.description}</p>
            </div>
            <svg
              className="ml-auto mt-1 h-5 w-5 shrink-0 text-ink-4 group-hover:text-gold-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-3">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-forest-800 hover:text-forest-900">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
