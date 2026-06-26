import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type UserRole = 'student' | 'instructor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string, role: UserRole) => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'sgpg-auth-user'

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser())

  const persistUser = useCallback((next: User | null) => {
    setUser(next)
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const signIn = useCallback(
    async (email: string, _password: string, role: UserRole) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      const stored = loadStoredUser()
      const normalizedEmail = email.trim().toLowerCase()
      const name =
        stored && stored.email.toLowerCase() === normalizedEmail
          ? stored.name
          : role === 'instructor'
            ? 'Mahesh M.'
            : normalizedEmail.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Learner'
      const next: User = {
        id: stored?.email.toLowerCase() === normalizedEmail ? stored.id : crypto.randomUUID(),
        name,
        email: email.trim(),
        role,
        avatarInitials: initialsFromName(name),
      }
      persistUser(next)
    },
    [persistUser],
  )

  const register = useCallback(
    async (name: string, email: string, _password: string, role: UserRole) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const next: User = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        avatarInitials: initialsFromName(name),
      }
      persistUser(next)
    },
    [persistUser],
  )

  const signOut = useCallback(() => {
    persistUser(null)
  }, [persistUser])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      signIn,
      register,
      signOut,
    }),
    [user, signIn, register, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
