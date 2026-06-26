export interface NavLink {
  label: string
  href: string
  description?: string
}

export interface NavItem {
  label: string
  href?: string
  children?: NavLink[]
}

export interface Course {
  id: string
  title: string
  instructor: string
  instructorUrl: string
  rating: number
  reviewCount: number
  price?: string
  badge?: string
  ctaLabel: string
  category: string
  level: string
  duration: string
  learners?: string
  trending?: boolean
  isNew?: boolean
  forTeams?: boolean
}

export interface Category {
  id: string
  title: string
  description: string
  courseCount: number
  icon: 'project' | 'cloud' | 'data' | 'coaching' | 'software'
}

export interface Benefit {
  title: string
  description: string
}

export interface Step {
  number: string
  title: string
  description: string
}

export interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  initials: string
  outcome?: string
}

export interface Certification {
  name: string
  provider: string
  category: string
  duration?: string
  careerOutcome?: string
}

export interface Metric {
  value: string
  label: string
  description: string
  icon: 'learners' | 'programs' | 'completion' | 'enterprise'
}

export const navItems: NavItem[] = [
  {
    label: 'Programs',
    children: [
      { label: 'Featured Courses', href: '/#courses', description: 'Expert-led programs with coaching' },
      { label: 'Browse Categories', href: '/#categories', description: 'Explore by skill area' },
      { label: 'Full Catalog', href: '/courses', description: 'View all available courses' },
    ],
  },
  { label: 'Certifications', href: '/#certifications' },
  {
    label: 'For Business',
    href: '/#enterprise',
    children: [
      { label: 'Enterprise Solutions', href: '/#enterprise', description: 'Team upskilling programs' },
      { label: 'Request Demo', href: '/#contact', description: 'Schedule a consultation' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'Blog & Insights', href: '/#blogs', description: 'Career guidance articles' },
      { label: 'How It Works', href: '/#how-it-works', description: 'Our coaching-first process' },
    ],
  },
]

/** @deprecated Use navItems instead */
export const navLinks: NavLink[] = [
  { label: 'Explore', href: '#courses' },
  { label: 'Categories', href: '#categories' },
  { label: 'For Business', href: '#enterprise' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Resources', href: '#blogs' },
]

export const searchSuggestions = [
  'Project Management',
  'AWS Certification',
  'Agile Coaching',
  'Data Analytics',
  'Leadership',
  'PMP',
  'Azure',
]

export const trustMetrics: Metric[] = [
  { value: '500+', label: 'Learners guided', description: 'Professionals transformed', icon: 'learners' },
  { value: '50+', label: 'Expert-led programs', description: 'Industry-aligned courses', icon: 'programs' },
  { value: '95%', label: 'Completion rate', description: 'With mentoring support', icon: 'completion' },
  { value: '40+', label: 'Enterprise teams', description: 'Companies trust us', icon: 'enterprise' },
]

export const industryImpact = [
  { stat: '3.2×', label: 'Faster skill application', detail: 'vs self-paced learning alone' },
  { stat: '87%', label: 'Career advancement', detail: 'within 12 months of completion' },
  { stat: '12K+', label: 'Certifications earned', detail: 'across cloud, PM, and data' },
]

export interface Partner {
  name: string
  logo?: string
}

export const trustPartners: Partner[] = [
  { name: 'Fortune 500 IT Teams', logo: '/partners/fortune.svg' },
  { name: 'Global Consulting Firms', logo: '/partners/global.svg' },
  { name: 'Startup Engineering Orgs', logo: '/partners/startup.svg' },
  { name: 'Higher Education Partners', logo: '/partners/highered.svg' },
]

export const featuredCourses: Course[] = [
  {
    id: 'bni-trainers',
    title: 'BNI-Trainers and Coaches Power Team',
    instructor: 'Mahesh M. · Sharva Group',
    instructorUrl: 'https://sharvaconsulting.com/members-directory/maheshmdsharvagroup-com/',
    rating: 4.8,
    reviewCount: 124,
    badge: 'Private',
    ctaLabel: 'View course',
    category: 'Leadership & Coaching',
    level: 'Advanced',
    duration: '8 weeks',
    learners: '120+',
    forTeams: true,
  },
  {
    id: 'it-project-management',
    title: 'IT Project Management Professional',
    instructor: 'Mahesh M. · Sharva Group',
    instructorUrl: 'https://sharvaconsulting.com/members-directory/maheshmdsharvagroup-com/',
    rating: 4.6,
    reviewCount: 89,
    price: '₹4,999',
    ctaLabel: 'Enroll now',
    category: 'Project Management',
    level: 'Intermediate',
    duration: '6 weeks',
    learners: '340+',
    trending: true,
  },
  {
    id: 'aws-solutions-architect',
    title: 'AWS Solutions Architect Certification Prep',
    instructor: 'Cloud Academy · Sharva Group',
    instructorUrl: 'https://sharvaconsulting.com/members-directory/maheshmdsharvagroup-com/',
    rating: 4.9,
    reviewCount: 256,
    price: '₹8,999',
    ctaLabel: 'Enroll now',
    category: 'Cloud & DevOps',
    level: 'Advanced',
    duration: '10 weeks',
    learners: '520+',
    trending: true,
    forTeams: true,
  },
  {
    id: 'agile-scrum-master',
    title: 'Certified Scrum Master (CSM) Prep',
    instructor: 'Agile Institute · Sharva Group',
    instructorUrl: 'https://sharvaconsulting.com/members-directory/maheshmdsharvagroup-com/',
    rating: 4.7,
    reviewCount: 178,
    price: '₹6,499',
    ctaLabel: 'Enroll now',
    category: 'Project Management',
    level: 'Intermediate',
    duration: '4 weeks',
    learners: '290+',
    isNew: true,
  },
  {
    id: 'data-analytics-pro',
    title: 'Google Data Analytics Professional Certificate',
    instructor: 'Data Labs · Sharva Group',
    instructorUrl: 'https://sharvaconsulting.com/members-directory/maheshmdsharvagroup-com/',
    rating: 4.8,
    reviewCount: 312,
    price: '₹5,999',
    ctaLabel: 'Enroll now',
    category: 'Data & Analytics',
    level: 'Beginner',
    duration: '12 weeks',
    learners: '680+',
    trending: true,
  },
  {
    id: 'demo-course',
    title: 'Career Discovery & Coaching Session',
    instructor: 'Kanchi Shah · Sharva Group',
    instructorUrl: 'https://sharvaconsulting.com/members-directory/ut35480gmail-com/',
    rating: 5.0,
    reviewCount: 45,
    ctaLabel: 'Apply to enroll',
    category: 'Leadership & Coaching',
    level: 'Beginner',
    duration: '2 weeks',
    learners: '200+',
    isNew: true,
  },
]

export const courseCategories: Category[] = [
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'PMP, Agile, and IT delivery frameworks for modern teams.',
    courseCount: 12,
    icon: 'project',
  },
  {
    id: 'cloud-devops',
    title: 'Cloud & DevOps',
    description: 'AWS, Azure, and infrastructure skills for scalable systems.',
    courseCount: 18,
    icon: 'cloud',
  },
  {
    id: 'data-analytics',
    title: 'Data & Analytics',
    description: 'Analytics, BI, and data-driven decision making.',
    courseCount: 9,
    icon: 'data',
  },
  {
    id: 'leadership-coaching',
    title: 'Leadership & Coaching',
    description: 'Executive coaching and team development programs.',
    courseCount: 7,
    icon: 'coaching',
  },
  {
    id: 'software-development',
    title: 'Software Development',
    description: 'Full-stack, QA, and engineering best practices.',
    courseCount: 15,
    icon: 'software',
  },
]

export const learningBenefits: Benefit[] = [
  {
    title: 'Coaching First',
    description: 'Coaching before you choose a course — know what fits you.',
  },
  {
    title: 'Clarity Over Confusion',
    description: 'Personalised career roadmap that aligns with your goals.',
  },
  {
    title: 'Career Growth',
    description: 'Skills that matter in the IT job market and real-project experience.',
  },
]

export const problemPoints: string[] = [
  'Wrong course selection → wasted time & money.',
  'No accountability → learners drop out halfway.',
  'Limited real-world application → certificates but no skills.',
]

export const solutionPoints: string[] = [
  'Right guidance → select the right certification.',
  'Personalised roadmap → aligned with your career goals.',
  'Ongoing mentoring → motivation & accountability.',
]

export const howItWorksSteps: Step[] = [
  {
    number: '01',
    title: 'Coaching First',
    description: 'Identify your career direction with a dedicated coach.',
  },
  {
    number: '02',
    title: 'Course Recommendation',
    description: 'Choose the certifications that truly matter for your goals.',
  },
  {
    number: '03',
    title: 'Guided Learning',
    description: 'Learn with accountability, mentoring, and peer support.',
  },
  {
    number: '04',
    title: 'Career Growth',
    description: 'Apply skills confidently in real-world IT projects.',
  },
]

export const traditionalPlatformPoints: string[] = [
  'Only provide content',
  'Self-paced, but lonely',
  'Random enrollments',
  'Certificates without clarity',
]

export const sgProGrowthPoints: string[] = [
  'Provide guidance + learning path',
  'Mentored learning with accountability',
  'Goal-driven course selection',
  'Skills + confidence + certifications',
]

export const testimonials: Testimonial[] = [
  {
    quote:
      'Personalised roadmap made me confident to interview and deliver on projects. The coaching session before enrollment saved me months of wasted effort.',
    name: 'Neha Sharma',
    role: 'Software Engineer',
    company: 'TechCorp India',
    initials: 'NS',
    outcome: 'Promoted to Senior Engineer',
  },
  {
    quote:
      'The mentoring kept me motivated and focused. I finally completed a course and applied the skills in real projects within weeks of finishing.',
    name: 'Riya Patel',
    role: 'Data Analyst',
    company: 'Insight Labs',
    initials: 'RP',
    outcome: 'Led analytics team of 5',
  },
  {
    quote:
      'I used to randomly enrol in courses. SG Pro Growth coaching helped me find the right AWS certification and land a better job with a 40% salary increase.',
    name: 'Ankit Kumar',
    role: 'Cloud Engineer',
    company: 'CloudScale',
    initials: 'AK',
    outcome: 'AWS Solutions Architect certified',
  },
]

export const certifications: Certification[] = [
  { name: 'AWS Solutions Architect', provider: 'Amazon Web Services', category: 'Cloud', duration: '10 weeks', careerOutcome: 'Cloud Architect roles' },
  { name: 'PMP', provider: 'PMI', category: 'Project Management', duration: '8 weeks', careerOutcome: 'Program Manager roles' },
  { name: 'Certified Scrum Master', provider: 'Scrum Alliance', category: 'Agile', duration: '4 weeks', careerOutcome: 'Scrum Master roles' },
  { name: 'ITIL Foundation', provider: 'Axelos', category: 'IT Service', duration: '6 weeks', careerOutcome: 'IT Service Manager' },
  { name: 'Google Data Analytics', provider: 'Google', category: 'Data', duration: '12 weeks', careerOutcome: 'Data Analyst roles' },
  { name: 'Azure Administrator', provider: 'Microsoft', category: 'Cloud', duration: '8 weeks', careerOutcome: 'Cloud Admin roles' },
]

export const corporateBenefits: string[] = [
  'Right-fit training aligned with company goals.',
  'Coaching-led development for higher retention.',
  'Measurable outcomes that impact performance.',
  'Customised programs for teams & leadership.',
]

export const footerLinks = {
  courses: [
    { label: 'All Courses', href: '/courses' },
    { label: 'Featured Programs', href: '/#courses' },
    { label: 'Categories', href: '/#categories' },
    { label: 'Certifications', href: '/#certifications' },
  ],
  company: [
    { label: 'About Us', href: '/#how-it-works' },
    { label: 'Blog & Resources', href: '/#blogs' },
    { label: 'Enterprise', href: '/#enterprise' },
    { label: 'Contact Us', href: '/#contact' },
  ],
  legal: [
    { label: 'Refund and Returns Policy', href: 'https://sharvaconsulting.com/refund_returns/' },
    { label: 'Privacy Policy', href: 'https://sharvaconsulting.com/privacy-policy/' },
    { label: 'Terms of Service', href: 'https://sharvaconsulting.com/terms-of-service/' },
  ],
}

export interface SuccessStory {
  name: string
  role: string
  company: string
  achievement: string
  timeToAchieve: string
  certification: string
  initials: string
}

export const successStories: SuccessStory[] = [
  {
    name: 'Neha Sharma',
    role: 'Software Engineer',
    company: 'TechCorp',
    achievement: 'Promoted to Senior Engineer',
    timeToAchieve: '6 months',
    certification: 'AWS Solutions Architect',
    initials: 'NS',
  },
  {
    name: 'Riya Patel',
    role: 'Data Analyst',
    company: 'Insight Labs',
    achievement: 'Led analytics team of 5',
    timeToAchieve: '4 months',
    certification: 'Google Data Analytics',
    initials: 'RP',
  },
  {
    name: 'Ankit Kumar',
    role: 'Cloud Engineer',
    company: 'CloudScale',
    achievement: 'Salary increased by 40%',
    timeToAchieve: '8 months',
    certification: 'Azure Administrator',
    initials: 'AK',
  },
]

export const whyChooseUs = [
  {
    title: 'Coaching First',
    description: 'Personalized career guidance before you invest in courses — every learner starts with clarity.',
    icon: 'coaching',
  },
  {
    title: 'Expert Mentors',
    description: 'Learn from industry professionals with 10+ years of real-world IT and leadership experience.',
    icon: 'mentor',
  },
  {
    title: 'Real Projects',
    description: 'Apply skills to actual business scenarios and portfolio-worthy projects, not just theory.',
    icon: 'projects',
  },
  {
    title: 'Career Support',
    description: 'Resume reviews, interview prep, and job placement assistance included in every program.',
    icon: 'career',
  },
  {
    title: 'Flexible Learning',
    description: 'Self-paced content with scheduled mentorship sessions that fit your schedule.',
    icon: 'flexible',
  },
  {
    title: 'Certification Ready',
    description: 'Exam prep, practice tests, and coaching included for industry-recognized credentials.',
    icon: 'certification',
  },
]

export const featuredCertifications = [
  { name: 'AWS Solutions Architect', provider: 'Amazon Web Services', icon: 'aws', learners: '2.5M+', duration: '10 weeks', outcome: 'Avg. salary +₹8L' },
  { name: 'PMP Certification', provider: 'PMI', icon: 'pmp', learners: '1.2M+', duration: '8 weeks', outcome: 'Avg. salary +₹6L' },
  { name: 'Google Data Analytics', provider: 'Google', icon: 'google', learners: '800K+', duration: '12 weeks', outcome: 'Entry to mid-level' },
  { name: 'Azure Administrator', provider: 'Microsoft', icon: 'azure', learners: '600K+', duration: '8 weeks', outcome: 'Cloud admin roles' },
  { name: 'Scrum Master', provider: 'Scrum Alliance', icon: 'scrum', learners: '900K+', duration: '4 weeks', outcome: 'Agile team lead' },
  { name: 'ITIL Foundation', provider: 'Axelos', icon: 'itil', learners: '500K+', duration: '6 weeks', outcome: 'IT service roles' },
]

export const blogPosts = [
  {
    title: 'How to choose the right IT certification in 2026',
    excerpt: 'A coaching-first framework for evaluating certifications against your career goals and market demand.',
    date: 'May 12, 2026',
    readTime: '6 min read',
    category: 'Career Guidance',
  },
  {
    title: 'Why mentoring beats self-paced learning alone',
    excerpt: 'Accountability and guidance dramatically improve course completion and skill application rates.',
    date: 'Apr 28, 2026',
    readTime: '4 min read',
    category: 'Learning Strategy',
  },
  {
    title: 'Building a corporate upskilling program that works',
    excerpt: 'Align team training with business outcomes using synergised coaching and measurable KPIs.',
    date: 'Apr 15, 2026',
    readTime: '8 min read',
    category: 'Enterprise',
  },
]
