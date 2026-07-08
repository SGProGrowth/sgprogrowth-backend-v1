import { FeaturePlaceholder } from '../../components/dashboard/FeaturePlaceholder'
import type { NavIcon } from '../../data/dashboardData'

interface ComingSoonConfig {
  icon: NavIcon
  title: string
  description: string
  features: string[]
}

export function createComingSoonPage(config: ComingSoonConfig) {
  return function ComingSoonPage() {
    return (
      <FeaturePlaceholder
        icon={config.icon}
        title={config.title}
        description={config.description}
        features={config.features}
      />
    )
  }
}

export const StudentDownloadsComingSoon = createComingSoonPage({
  icon: 'content',
  title: 'Downloads',
  description: 'A centralized library for course materials, study guides, and downloadable resources is on the way.',
  features: [
    'Course study guides',
    'Module resource packs',
    'Video downloads',
    'Certificate PDFs',
    'Offline reading',
  ],
})

export const InstructorEarningsComingSoon = createComingSoonPage({
  icon: 'earnings',
  title: 'Earnings & Payouts',
  description: 'Revenue tracking and instructor payout management will be available in a future release.',
  features: [
    'Monthly revenue reports',
    'Payout history',
    'Tax statements',
    'Course-level earnings',
    'Payout method setup',
  ],
})

export const StudentMessagesComingSoon = createComingSoonPage({
  icon: 'messages',
  title: 'Messages',
  description: 'Direct messaging with instructors and coaches is coming soon. You will be notified when it launches.',
  features: [
    'Instructor inbox',
    'Compose & reply',
    'Course-threaded messages',
    'Read receipts',
    'Email notifications',
  ],
})

export const InstructorMessagesComingSoon = createComingSoonPage({
  icon: 'messages',
  title: 'Messages',
  description: 'Student messaging and inbox management is coming soon.',
  features: [
    'Student conversations',
    'Bulk announcements',
    'Threaded replies',
    'Unread tracking',
    'Email digests',
  ],
})

export const InstructorAnnouncementsComingSoon = createComingSoonPage({
  icon: 'announcements',
  title: 'Announcements',
  description: 'Course-wide announcements and learner broadcasts are coming soon.',
  features: [
    'Create announcements',
    'Schedule delivery',
    'Audience targeting',
    'Email + in-app delivery',
    'Announcement history',
  ],
})

export const InstructorCoachingComingSoon = createComingSoonPage({
  icon: 'coaching',
  title: 'Live Session Scheduling',
  description: 'Scheduling and managing live coaching sessions is coming soon.',
  features: [
    'Schedule 1:1 sessions',
    'Group coaching',
    'Office hours',
    'Calendar integration',
    'Meeting links',
  ],
})

export const StudentCoachingComingSoon = createComingSoonPage({
  icon: 'coaching',
  title: 'Live Sessions',
  description: 'Session booking and live coaching management is coming soon.',
  features: [
    'View scheduled sessions',
    'Request coaching',
    'Join live meetings',
    'Session history',
    'Coach availability',
  ],
})
