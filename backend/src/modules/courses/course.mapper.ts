import { Prisma } from '@prisma/client'
import {
  formatDateLabel,
  formatDuration,
  formatLearnerCount,
  formatPrice,
} from '../../common/utils/course.util'

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    category: true
    instructor: { include: { instructorProfile: true } }
    outcomes: true
    requirements: true
    modules: { include: { lessons: true } }
    _count: { select: { enrollments: true } }
  }
}>

type CourseCatalogRow = Prisma.CourseGetPayload<{
  include: {
    category: true
    instructor: { include: { instructorProfile: true } }
    _count: { select: { enrollments: true } }
  }
}>

export function instructorDisplayName(
  instructor: { instructorProfile?: { displayName: string; publicSlug?: string | null } | null },
): string {
  return instructor.instructorProfile?.displayName ?? 'Instructor'
}

export function instructorPublicUrl(
  instructor: { instructorProfile?: { publicSlug?: string | null } | null },
): string {
  const slug = instructor.instructorProfile?.publicSlug
  return slug ? `/instructors/${slug}` : '#'
}

export function mapCatalogCourse(course: CourseCatalogRow) {
  const enrollmentCount = course._count.enrollments
  const instructorName = instructorDisplayName(course.instructor)

  return {
    id: course.slug,
    title: course.title,
    instructor: instructorName,
    instructorUrl: instructorPublicUrl(course.instructor),
    rating: course.ratingAvg,
    reviewCount: course.reviewCount,
    price: formatPrice(course.priceCents, course.currency),
    badge: course.coachingIncluded ? 'Coaching included' : course.isNew ? 'New' : undefined,
    ctaLabel: course.priceCents > 0 ? 'View program' : 'Enroll free',
    category: course.category?.title ?? 'General',
    categorySlug: course.category?.slug,
    level: course.level ?? 'All levels',
    duration: formatDuration(course.durationHours),
    learners: formatLearnerCount(enrollmentCount),
    trending: course.trending,
    isNew: course.isNew,
    forTeams: course.forTeams,
    featured: course.featured,
    coachingIncluded: course.coachingIncluded,
    thumbnail: course.category?.icon ?? 'course',
    subtitle: course.subtitle,
  }
}

export function mapCatalogDetail(course: CourseWithRelations) {
  const base = mapCatalogCourse(course)
  return {
    ...base,
    description: course.description ?? '',
    learningOutcomes: course.outcomes.sort((a, b) => a.sortOrder - b.sortOrder).map((o) => o.text),
    requirements: course.requirements.sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.text),
    visibility: course.visibility,
    moduleCount: course.modules.length,
    lessonCount: course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    modules: course.modules
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        id: m.id,
        title: m.title,
        order: m.sortOrder,
        lessonCount: m.lessons.length,
      })),
  }
}

export function mapInstructorCourse(
  course: CourseWithRelations,
  instructorId: string,
) {
  const enrollmentCount = course._count.enrollments
  const revenueNum = course.priceCents * enrollmentCount

  return {
    id: course.slug,
    instructorId,
    title: course.title,
    subtitle: course.subtitle ?? '',
    description: course.description ?? '',
    categoryId: course.category?.slug ?? '',
    category: course.category?.title ?? 'General',
    level: course.level ?? 'Intermediate',
    duration: formatDuration(course.durationHours),
    status: course.status,
    students: enrollmentCount,
    completion: 0,
    rating: course.ratingAvg,
    reviewCount: course.reviewCount,
    revenue: revenueNum > 0 ? formatPrice(revenueNum, course.currency) : '—',
    price: formatPrice(course.priceCents, course.currency),
    thumbnail: course.category?.icon ?? 'course',
    banner: course.bannerUrl ?? 'banner',
    learningOutcomes: course.outcomes.sort((a, b) => a.sortOrder - b.sortOrder).map((o) => o.text),
    requirements: course.requirements.sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.text),
    visibility: course.visibility,
    coachingIncluded: course.coachingIncluded,
    updatedAt: formatDateLabel(course.updatedAt),
    featured: course.featured,
    trending: course.trending,
    isNew: course.isNew,
    forTeams: course.forTeams,
    modules: course.modules
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        id: m.id,
        title: m.title,
        order: m.sortOrder,
        lessons: m.lessons
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description ?? '',
            type: l.type,
            duration: l.durationMinutes ? `${l.durationMinutes} min` : '',
            order: l.sortOrder,
          })),
      })),
  }
}

export function mapEnrolledCourse(
  enrollment: {
    status: string
    progressPct: number
    modulesCompleted: number
    hoursSpent: number
    lastAccessedAt: Date | null
    course: {
      slug: string
      title: string
      level: string | null
      durationHours: number | null
      ratingAvg: number
      category: { title: string; icon: string | null } | null
      instructor: { instructorProfile: { displayName: string } | null }
      modules?: unknown[]
    }
  },
) {
  const c = enrollment.course
  const instructorName = instructorDisplayName(c.instructor)
  const isCompleted = enrollment.status === 'completed'
  const totalModules = c.modules?.length ?? 0

  return {
    id: c.slug,
    title: c.title,
    instructor: `${c.category?.title ?? 'SG Pro Growth'} · SG Pro Growth`,
    coach: instructorName,
    category: c.category?.title ?? 'General',
    level: c.level ?? 'Intermediate',
    duration: formatDuration(c.durationHours),
    progress: enrollment.progressPct,
    modulesCompleted: enrollment.modulesCompleted,
    totalModules: totalModules || 10,
    lastAccessed: enrollment.lastAccessedAt
      ? formatDateLabel(enrollment.lastAccessedAt)
      : 'Recently',
    nextLesson: isCompleted ? 'Completed' : 'Continue learning',
    status: isCompleted ? ('completed' as const) : ('active' as const),
    thumbnail: c.category?.icon ?? 'course',
    rating: c.ratingAvg,
    hoursSpent: enrollment.hoursSpent,
  }
}

export const courseDetailInclude = {
  category: true,
  instructor: { include: { instructorProfile: true } },
  outcomes: true,
  requirements: true,
  modules: { include: { lessons: true }, orderBy: { sortOrder: 'asc' as const } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseInclude

export const courseCatalogInclude = {
  category: true,
  instructor: { include: { instructorProfile: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseInclude
