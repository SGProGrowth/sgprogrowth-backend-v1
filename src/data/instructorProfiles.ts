export interface InstructorProfile {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  title: string
  designation: string
  bio: string
  avatarInitials: string
  avatarUrl?: string
  publicUrl: string
  expertise: string[]
  credentials: string[]
  skills: string[]
  experience: string
  avgRating: number
}

/** Mock instructor accounts — replace with API lookup on sign-in */
export const instructorProfiles: InstructorProfile[] = [
  {
    id: 'inst-001',
    name: 'Aanya Mehta',
    email: 'cloud.lead@example.com',
    phone: '+91 98765 43210',
    organization: 'Sharva Group · Cloud Academy',
    title: 'Senior Cloud Architect & Coach',
    designation: 'Lead Instructor — Cloud & DevOps',
    bio: '15+ years designing cloud-native systems and coaching professionals through AWS certification paths with hands-on mentoring.',
    avatarInitials: 'AM',
    publicUrl: 'members.example.com/instructors/aanya-mehta',
    expertise: ['AWS Solutions Architect', 'Cloud Infrastructure', 'DevOps', 'Career Coaching'],
    credentials: ['AWS Certified Solutions Architect', 'AWS DevOps Engineer', 'CSM'],
    skills: ['AWS', 'Terraform', 'Kubernetes', 'System Design', 'Mentoring'],
    experience: '15+ years',
    avgRating: 4.8,
  },
  {
    id: 'inst-002',
    name: 'Rohan Kapoor',
    email: 'pm.coach@example.com',
    phone: '+91 91234 56789',
    organization: 'Sharva Group · PM Institute',
    title: 'IT Project Management Coach',
    designation: 'Lead Instructor — Project Management',
    bio: 'PMP-certified delivery leader helping IT teams adopt Agile, stakeholder management, and certification-ready project practices.',
    avatarInitials: 'RK',
    publicUrl: 'members.example.com/instructors/rohan-kapoor',
    expertise: ['PMP', 'Agile & Scrum', 'Stakeholder Management', 'IT Delivery'],
    credentials: ['PMP', 'CSM', 'SAFe Agilist'],
    skills: ['Project Planning', 'Risk Management', 'Agile', 'Team Leadership'],
    experience: '12+ years',
    avgRating: 4.6,
  },
  {
    id: 'inst-003',
    name: 'Sneha Desai',
    email: 'data.trainer@example.com',
    phone: '+91 99887 76655',
    organization: 'Sharva Group · Analytics Lab',
    title: 'Data Analytics Instructor',
    designation: 'Instructor — Data & BI',
    bio: 'Analytics practitioner focused on SQL, Python, and business intelligence workflows for early-career data professionals.',
    avatarInitials: 'SD',
    publicUrl: 'members.example.com/instructors/sneha-desai',
    expertise: ['Data Analytics', 'SQL', 'Power BI', 'Python for Data'],
    credentials: ['Microsoft PL-300', 'Google Data Analytics'],
    skills: ['SQL', 'Python', 'Power BI', 'Data Modeling', 'ETL'],
    experience: '8+ years',
    avgRating: 4.7,
  },
]

export function findInstructorProfileByEmail(email: string): InstructorProfile | undefined {
  const normalized = email.trim().toLowerCase()
  return instructorProfiles.find((p) => p.email.toLowerCase() === normalized)
}

export function findInstructorProfileById(id: string): InstructorProfile | undefined {
  return instructorProfiles.find((p) => p.id === id)
}

export function resolveInstructorProfile(
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): InstructorProfile {
  if (userId) {
    const byId = findInstructorProfileById(userId)
    if (byId) return byId
  }
  const byEmail = findInstructorProfileByEmail(email)
  if (byEmail) return byEmail

  return {
    id: userId,
    name,
    email: email.trim(),
    phone: '',
    organization: '',
    title: 'Instructor',
    designation: 'Instructor',
    bio: '',
    avatarInitials,
    publicUrl: '',
    expertise: [],
    credentials: [],
    skills: [],
    experience: '',
    avgRating: 0,
  }
}
