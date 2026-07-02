import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.module'
import { AnalyticsService } from '../analytics/analytics.service'

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const defaultAnalytics = {
  enrollmentTrend: [] as number[],
  completionTrend: [] as number[],
  revenueTrend: [] as number[],
  engagementRate: 0,
  avgSessionRating: 4.8,
  topCourses: [] as Array<{ id?: string; title: string; students: number; completion?: number; revenue?: string; rating?: number }>,
}

@Injectable()
export class InstructorsService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  async getWorkspace(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        instructorProfile: true,
        instructedCourses: {
          include: {
            category: true,
            modules: { include: { lessons: true }, orderBy: { sortOrder: 'asc' } },
            enrollments: { include: { student: { include: { studentProfile: true } } } },
          },
        },
        assignments: {
          include: {
            course: true,
            submissions: {
              include: {
                enrollment: {
                  include: { student: { include: { studentProfile: true } } },
                },
              },
            },
          },
        },
        quizzes: { include: { course: true, questions: true } },
        questions: {
          include: { _count: { select: { quizQuestions: true } } },
        },
        announcements: { include: { course: true } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 50 },
        calendarEvents: { orderBy: { startsAt: 'asc' }, take: 30 },
        coachingSessions: { orderBy: { startsAt: 'asc' }, take: 20 },
      },
    })

    if (!user?.instructorProfile) {
      throw new NotFoundException('Instructor profile not found')
    }

    const profile = user.instructorProfile
    const instructorId = userId

    const courses = user.instructedCourses.map((c) => {
      const studentCount = c.enrollments.length
      const completion =
        studentCount > 0
          ? Math.round(c.enrollments.reduce((s, e) => s + e.progressPct, 0) / studentCount)
          : 0
      const revenueNum = c.priceCents * studentCount
      return {
        id: c.slug,
        instructorId,
        title: c.title,
        subtitle: c.subtitle ?? '',
        description: c.description ?? '',
        categoryId: c.category?.slug ?? '',
        category: c.category?.title ?? 'General',
        level: c.level ?? 'Intermediate',
        duration: c.durationHours ? `${c.durationHours} weeks` : 'Self-paced',
        status: c.status as 'draft' | 'published' | 'archived',
        students: studentCount,
        completion,
        rating: c.ratingAvg,
        reviewCount: c.reviewCount,
        revenue: revenueNum > 0 ? `₹${revenueNum.toLocaleString('en-IN')}` : '₹0',
        price: c.priceCents > 0 ? `₹${(c.priceCents / 100).toLocaleString('en-IN')}` : 'Free',
        thumbnail: c.category?.icon ?? 'course',
        banner: 'banner',
        learningOutcomes: [] as string[],
        requirements: [] as string[],
        visibility: c.visibility as 'public' | 'private' | 'invite',
        coachingIncluded: c.coachingIncluded,
        updatedAt: formatDate(c.updatedAt),
        modules: c.modules.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.sortOrder,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type as 'video' | 'pdf' | 'resource' | 'live' | 'quiz' | 'assignment',
            duration: l.durationMinutes ? `${l.durationMinutes} min` : '',
            order: l.sortOrder,
          })),
        })),
      }
    })

    const students = user.instructedCourses.flatMap((c) =>
      c.enrollments.map((e) => ({
        id: e.studentId,
        name: e.student.studentProfile?.displayName ?? e.student.email,
        email: e.student.email,
        avatarInitials: initials(e.student.studentProfile?.displayName ?? e.student.email),
        courseId: c.slug,
        courseTitle: c.title,
        enrolledDate: formatDate(e.enrolledAt),
        progress: e.progressPct,
        lastActive: e.lastAccessedAt ? relativeTime(e.lastAccessedAt) : 'Recently',
        status: (e.progressPct >= 100 ? 'completed' : e.progressPct < 30 ? 'at-risk' : 'active') as
          | 'active'
          | 'at-risk'
          | 'completed',
      })),
    )

    const grades = user.assignments.flatMap((a) =>
      a.submissions.map((sub) => ({
        id: sub.id,
        instructorId,
        studentName:
          sub.enrollment.student.studentProfile?.displayName ?? sub.enrollment.student.email,
        courseTitle: a.course.title,
        assignmentTitle: a.title,
        submittedDate: sub.submittedAt ? formatDate(sub.submittedAt) : 'Pending',
        score: sub.score,
        maxScore: a.maxScore,
        status: sub.status as 'pending' | 'graded' | 'late',
      })),
    )

    const liveSessions = user.coachingSessions.map((s) => ({
      id: s.id,
      instructorId,
      title: s.title,
      courseTitle: 'Coaching',
      studentName: undefined as string | undefined,
      date: formatDate(s.startsAt),
      time: s.startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: `${s.durationMinutes} min`,
      type: s.type as '1:1' | 'group' | 'office-hours',
      status: s.status as 'scheduled' | 'completed' | 'cancelled',
      meetingLink: s.meetingUrl ?? '#',
    }))

    const announcements = user.announcements.map((a) => ({
      id: a.id,
      instructorId,
      title: a.title,
      courseTitle: a.course?.title ?? 'All courses',
      message: a.body,
      date: formatDate(a.createdAt),
      audience: a.audience as 'all' | 'course' | 'at-risk',
      status: a.status === 'sent' ? ('sent' as const) : ('draft' as const),
    }))

    const notifications = user.notifications.map((n) => ({
      id: n.id,
      instructorId,
      title: n.title,
      message: n.body,
      time: relativeTime(n.createdAt),
      read: Boolean(n.readAt),
      type: 'system' as 'enrollment' | 'submission' | 'review' | 'session' | 'system',
    }))

    const calendarEvents = user.calendarEvents.map((ev) => ({
      id: ev.id,
      instructorId,
      title: ev.title,
      date: ev.startsAt.toISOString().slice(0, 10),
      time: ev.startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      type: ev.type as 'session' | 'deadline' | 'live' | 'review',
      courseTitle: undefined as string | undefined,
    }))

    const quizzes = user.quizzes.map((q) => ({
      id: q.id,
      instructorId,
      title: q.title,
      courseId: q.courseId ? user.instructedCourses.find((c) => c.id === q.courseId)?.slug ?? null : null,
      courseTitle: q.course?.title ?? 'All courses',
      questions: q.questions.length,
      duration: `${q.durationMinutes} min`,
      attempts: q.maxAttempts,
      status: q.status === 'published' ? ('published' as const) : ('draft' as const),
      isGeneric: q.isGeneric,
      passScore: q.passScore ?? undefined,
      lastUpdated: formatDate(q.updatedAt),
    }))

    const assignments = user.assignments.map((a) => ({
      id: a.id,
      instructorId,
      title: a.title,
      courseId: a.course.slug,
      courseTitle: a.course.title,
      dueDate: a.dueAt ? formatDate(a.dueAt) : 'No due date',
      type: a.type,
      submissions: a.submissions.length,
      totalStudents: students.filter((s) => s.courseId === a.course.slug).length,
      status: a.status === 'published' ? ('published' as const) : ('draft' as const),
      maxScore: a.maxScore,
      allowLate: a.allowLate,
    }))

    const questionBank = user.questions.map((q) => ({
      id: q.id,
      instructorId,
      question: q.questionText,
      type: q.type.replace(/_/g, '-').replace('multiple-choice', 'multiple-choice') as
        | 'multiple-choice'
        | 'true-false'
        | 'short-answer'
        | 'essay',
      category: q.category ?? 'General',
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      courseTitle: undefined as string | undefined,
      tags: q.tags,
      usedIn: q._count.quizQuestions,
      points: q.marks,
      status: q.status === 'active' ? ('active' as const) : ('archived' as const),
    }))

    const batches = await this.prisma.batch.findMany({
      where: {
        OR: [{ instructorId: userId }, { instructors: { some: { instructorId: userId } } }],
      },
      include: { course: true, batchEnrollments: { where: { status: { not: 'dropped' } } } },
    })

    const batchDtos = batches.map((b) => ({
      id: b.id,
      instructorId: userId,
      name: b.name,
      courseId: b.course.slug,
      courseTitle: b.course.title,
      startDate: formatDate(b.startDate),
      endDate: b.endDate ? formatDate(b.endDate) : 'TBD',
      status: b.status as 'active' | 'upcoming' | 'completed' | 'cancelled' | 'draft' | 'archived',
      studentsCount: b.batchEnrollments.filter((e) => e.status !== 'waitlist').length,
      maxCapacity: b.maxCapacity,
      schedule: b.schedule ?? '',
      completionRate: Math.round(b.completionRate),
    }))

    const published = courses.filter((c) => c.status === 'published')
    const revenueTotal = published.reduce((s, c) => s + parseInt(c.revenue.replace(/[^\d]/g, ''), 10), 0)

    const summary = {
      totalStudents: students.length,
      activeCourses: published.length,
      avgCompletion:
        published.length > 0
          ? Math.round(published.reduce((s, c) => s + c.completion, 0) / published.length)
          : 0,
      sessionsThisWeek: liveSessions.filter((s) => s.status === 'scheduled').length,
      pendingGrades: grades.filter((g) => g.status === 'pending').length,
      monthlyRevenue: revenueTotal > 0 ? `₹${revenueTotal.toLocaleString('en-IN')}` : '—',
      newEnrollments: students.length > 0 ? Math.max(1, Math.floor(students.length * 0.08)) : 0,
      coursesCreated: courses.length,
      coursesPublished: published.length,
      studentsEnrolled: students.length,
    }

    let analytics = defaultAnalytics
    try {
      analytics = await this.analyticsService.getInstructorOverviewForWorkspace(userId)
    } catch {
      analytics = {
        ...defaultAnalytics,
        topCourses: published.slice(0, 3).map((c) => ({
          id: c.id,
          title: c.title,
          students: c.students,
          completion: c.completion,
          rating: c.rating,
        })),
      }
    }

    return {
      profile: {
        id: userId,
        name: profile.displayName,
        email: user.email,
        phone: profile.phone ?? '',
        organization: profile.organizationLabel ?? '',
        title: profile.title ?? profile.designation ?? '',
        designation: profile.designation ?? '',
        bio: profile.bio ?? '',
        avatarInitials: initials(profile.displayName),
        publicUrl: profile.publicSlug ? `/instructors/${profile.publicSlug}` : '',
        expertise: profile.expertise,
        credentials: profile.credentials,
        skills: profile.skills,
        experience: profile.experience ?? '',
        avgRating: profile.avgRating,
      },
      courses,
      students,
      grades,
      liveSessions,
      announcements,
      messages: [] as Array<{
        id: string
        instructorId: string
        from: string
        subject: string
        preview: string
        time: string
        read: boolean
        courseTitle?: string
      }>,
      notifications,
      calendarEvents,
      quizzes,
      assignments,
      questionBank,
      batches: batchDtos,
      bulkImportPreview: [],
      summary,
      analytics,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    }
  }
}
