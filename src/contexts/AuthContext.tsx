import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  displayNameFromEmail,
  getOrCreateUserId,
  getRegistration,
  clearRegistration,
  saveRegistration,
  initialsFromName,
  normalizeEmail,
} from '../lib/auth/userSession'
import { clearWorkspaceCache } from '../lib/workspaceCache'
import { findInstructorProfileByEmail } from '../data/instructorProfiles'
import { findStudentProfileByEmail } from '../data/studentProfiles'

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

function resolveAuthUser(
  email: string,
  role: UserRole,
  nameOverride?: string,
): User {
  const normalizedEmail = normalizeEmail(email)
  const catalog =
    role === 'instructor'
      ? findInstructorProfileByEmail(normalizedEmail)
      : findStudentProfileByEmail(normalizedEmail)

  const fallbackName = displayNameFromEmail(
    normalizedEmail,
    role === 'instructor' ? 'Instructor' : 'Learner',
  )
  const name = nameOverride?.trim() || catalog?.name || fallbackName
  const id = catalog?.id ?? getOrCreateUserId(normalizedEmail, role)

  return {
    id,
    name,
    email: email.trim(),
    role,
    avatarInitials: catalog?.avatarInitials ?? initialsFromName(name),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser())

  const persistUser = useCallback((next: User | null) => {
    setUser(next)
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
      clearWorkspaceCache()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, _password: string, role: UserRole) => {
      // Replace with API call: POST /auth/login → { user, token }
      const registration = getRegistration(email, role)
      const next = resolveAuthUser(email, role, registration?.name)
      clearRegistration(email, role)
      persistUser(next)
    },
    [persistUser],
  )

  const register = useCallback(
    async (name: string, email: string, _password: string, role: UserRole) => {
      // Replace with API call: POST /auth/register — creates account only, no session
      saveRegistration(name, email, role)
    },
    [],
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
