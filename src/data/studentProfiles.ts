export interface StudentProfile {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  title: string
  bio: string
  avatarInitials: string
  timezone: string
  memberSince: string
}

/** Mock learner accounts — replace with API lookup on sign-in */
export const studentProfiles: StudentProfile[] = [
  {
    id: 'stud-001',
    name: 'Neha Sharma',
    email: 'neha.sharma@example.com',
    phone: '+91 98123 45678',
    organization: 'TechCorp India',
    title: 'Software Engineer · Cloud track',
    bio: 'Preparing for AWS Solutions Architect certification with coaching-led learning.',
    avatarInitials: 'NS',
    timezone: 'Asia/Kolkata (IST)',
    memberSince: 'May 2026',
  },
  {
    id: 'stud-002',
    name: 'Ankit Verma',
    email: 'ankit.verma@example.com',
    phone: '+91 98765 12345',
    organization: 'CloudStart LLP',
    title: 'DevOps Analyst',
    bio: 'Focused on cloud infrastructure and project management skills for career transition.',
    avatarInitials: 'AV',
    timezone: 'Asia/Kolkata (IST)',
    memberSince: 'Jun 2026',
  },
]

export function findStudentProfileByEmail(email: string): StudentProfile | undefined {
  const normalized = email.trim().toLowerCase()
  return studentProfiles.find((p) => p.email.toLowerCase() === normalized)
}

export function findStudentProfileById(id: string): StudentProfile | undefined {
  return studentProfiles.find((p) => p.id === id)
}

export function resolveStudentProfile(
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): StudentProfile {
  if (userId) {
    const byId = findStudentProfileById(userId)
    if (byId) return byId
  }
  const byEmail = findStudentProfileByEmail(email)
  if (byEmail) return byEmail

  return {
    id: userId,
    name,
    email: email.trim(),
    phone: '',
    organization: '',
    title: '',
    bio: '',
    avatarInitials,
    timezone: 'Asia/Kolkata (IST)',
    memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  }
}
