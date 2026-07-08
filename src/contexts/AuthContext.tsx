import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  loginAccount,
  logoutAccount,
  registerAccount,
  restoreSession,
  saveLoginSession,
} from '../lib/api/auth'
import { clearAuthStorage, getStoredUser, type StoredAuthUser } from '../lib/api/tokenStorage'
import { clearWorkspaceCache } from '../lib/workspaceCache'

export type UserRole = 'student' | 'instructor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
  emailVerified: boolean
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string, role: UserRole) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<{ email: string; role: UserRole; requiresVerification: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toUser(stored: StoredAuthUser): User {
  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    avatarInitials: stored.avatarInitials,
    emailVerified: stored.emailVerified,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredUser()
    return stored ? toUser(stored) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const restored = await restoreSession()
        if (!cancelled) {
          setUser(restored ? toUser(restored) : null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string, role: UserRole) => {
    const response = await loginAccount({ email, password, role })
    const next = saveLoginSession(response)
    setUser(toUser(next))
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      const result = await registerAccount({ name, email, password, role })
      return { email: result.email, role: result.role, requiresVerification: result.requiresVerification }
    },
    [],
  )

  const signOut = useCallback(async () => {
    try {
      await logoutAccount()
    } finally {
      clearAuthStorage()
      clearWorkspaceCache()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signIn,
      register,
      signOut,
    }),
    [user, isLoading, signIn, register, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
