import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.module'
import { ProgressService } from '../progress/progress.service'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
  ) {}

  async getWorkspace(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        enrollments: {
          include: {
            course: { include: { category: true, instructor: { include: { instructorProfile: true } }, modules: true } },
            batch: true,
            milestones: true,
            certificates: true,
            submissions: { include: { assignment: true } },
            quizAttempts: { include: { quiz: true } },
          },
        },
        notifications: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!user?.studentProfile) {
      throw new NotFoundException('Student profile not found')
    }

    const profile = user.studentProfile
    const enrollments = user.enrollments
    const courseIds = new Set(enrollments.map((e) => e.courseId))

    const courses = enrollments.map((e) => {
      const c = e.course
      const instructorName = c.instructor.instructorProfile?.displayName ?? 'Instructor'
      const isCompleted = e.status === 'completed'
      return {
        id: c.slug,
        title: c.title,
        instructor: `${c.category?.title ?? 'SG Pro Growth'} · SG Pro Growth`,
        coach: instructorName,
        category: c.category?.title ?? 'General',
        level: c.level ?? 'Intermediate',
        duration: c.durationHours ? `${c.durationHours} weeks` : 'Self-paced',
        progress: e.progressPct,
        modulesCompleted: e.modulesCompleted,
        totalModules: c.modules.length > 0 ? c.modules.length : Math.max(e.modulesCompleted, 1),
        lastAccessed: e.lastAccessedAt ? relativeTime(e.lastAccessedAt) : 'Recently',
        nextLesson: isCompleted ? 'Completed' : 'Continue learning',
        status: isCompleted ? ('completed' as const) : ('active' as const),
        thumbnail: c.category?.icon ?? 'course',
        rating: c.ratingAvg,
        hoursSpent: e.hoursSpent,
      }
    })

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId: { in: [...courseIds] }, status: 'published' },
      include: { course: true, submissions: { where: { enrollment: { studentId: userId } } } },
    })

    const assignmentDtos = assignments.map((a) => {
      const sub = a.submissions[0]
      let status: 'pending' | 'submitted' | 'graded' | 'overdue' = 'pending'
      if (sub?.status === 'graded') status = 'graded'
      else if (sub?.status === 'submitted') status = 'submitted'
      else if (sub?.status === 'late') status = 'overdue'
      else if (a.dueAt && a.dueAt < new Date()) status = 'overdue'

      return {
        id: a.id,
        title: a.title,
        courseId: a.course.slug,
        courseTitle: a.course.title,
        dueDate: a.dueAt ? formatDateLabel(a.dueAt) : 'No due date',
        dueLabel: a.dueAt ? formatDateLabel(a.dueAt) : '',
        status,
        score: sub?.score ?? undefined,
        maxScore: a.maxScore,
        type: a.type as 'project' | 'essay' | 'lab' | 'reflection',
      }
    })

    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId: { in: [...courseIds] }, status: 'published' },
      include: { course: true, attempts: { where: { enrollment: { studentId: userId } } } },
    })

    const quizDtos = quizzes.map((q) => {
      const attempt = q.attempts[0]
      const completed =
        attempt?.status === 'submitted' ||
        attempt?.status === 'graded' ||
        attempt?.status === 'auto_graded'
      const inProgress = attempt?.status === 'in_progress'
      return {
        id: q.id,
        title: q.title,
        courseId: q.course?.slug ?? '',
        courseTitle: q.course?.title ?? 'Course quiz',
        date: attempt?.submittedAt ? formatDateLabel(attempt.submittedAt) : formatDateLabel(q.updatedAt),
        dateLabel: attempt?.submittedAt
          ? formatDateLabel(attempt.submittedAt)
          : inProgress
            ? 'In progress'
            : 'Upcoming',
        status: completed ? ('completed' as const) : inProgress ? ('in_progress' as const) : ('upcoming' as const),
        score: attempt?.score ?? undefined,
        maxScore: attempt?.maxScore ?? 100,
        attempts: attempt?.attemptNumber ?? 0,
        maxAttempts: q.maxAttempts,
        duration: q.unlimitedDuration ? 'Unlimited' : `${q.durationMinutes} min`,
      }
    })

    const certificates = enrollments.flatMap((e) =>
      e.certificates.map((cert) => ({
        id: cert.id,
        title: cert.title,
        courseId: e.course.slug,
        issuedDate: formatDateLabel(cert.issuedAt),
        credentialId: cert.credentialId,
        certificateNumber: cert.certificateNumber,
        instructor: cert.instructorName,
        studentName: cert.studentName,
        status: cert.status,
        verificationUrl: cert.verificationUrl,
        skills: cert.skills,
      })),
    )

    const notifications = user.notifications.map((n) => ({
      id: n.id,
      studentId: userId,
      type: this.mapNotificationType(n.type),
      title: n.title,
      message: n.body,
      time: relativeTime(n.createdAt),
      read: Boolean(n.readAt),
      actionLabel: n.actionUrl ? 'View' : undefined,
      actionHref: n.actionUrl ?? undefined,
    }))

    const milestones = enrollments.flatMap((e) =>
      e.milestones.map((m) => ({
        id: m.id,
        phase: m.phase,
        title: m.title,
        description: m.description ?? '',
        status: m.status as 'completed' | 'in-progress' | 'upcoming',
        date: m.completedAt ? formatDateLabel(m.completedAt) : 'In progress',
        courseId: e.course.slug,
      })),
    )

    const batchEnrollments = await this.prisma.batchEnrollment.findMany({
      where: { studentId: userId, status: { not: 'dropped' } },
      include: {
        batch: {
          include: {
            course: { include: { instructor: { include: { instructorProfile: true } } } },
            batchEnrollments: {
              where: { status: 'active' },
              include: { student: { include: { studentProfile: true } } },
            },
          },
        },
        enrollment: true,
      },
      orderBy: { enrolledAt: 'desc' },
    })

    const batches = await Promise.all(
      batchEnrollments.map(async (be) => {
        const instructorName =
          be.batch.course.instructor.instructorProfile?.displayName ?? 'Instructor'
        const batchmates = be.batch.batchEnrollments
          .filter((m) => m.studentId !== userId)
          .slice(0, 5)
          .map((m) => ({
            name: m.student.studentProfile?.displayName ?? m.student.email,
            initials: initials(m.student.studentProfile?.displayName ?? m.student.email),
            progress: 0,
          }))
        const studentsCount = be.batch.batchEnrollments.length

        const nextEvent = await this.prisma.batchEvent.findFirst({
          where: { batchId: be.batchId, startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
        })

        return {
          id: be.batch.id,
          name: be.batch.name,
          courseId: be.batch.course.slug,
          courseTitle: be.batch.course.title,
          instructor: instructorName,
          coach: instructorName,
          startDate: formatDateLabel(be.batch.startDate),
          endDate: be.batch.endDate ? formatDateLabel(be.batch.endDate) : 'TBD',
          status: be.batch.status as 'active' | 'upcoming' | 'completed',
          schedule: be.batch.schedule ?? '',
          studentsCount,
          progress: be.enrollment?.progressPct ?? 0,
          nextSession: nextEvent
            ? `${nextEvent.title} · ${formatDateLabel(nextEvent.startsAt)}`
            : be.batch.schedule ?? 'See calendar',
          batchmates,
        }
      }),
    )

    const coachingSessions = await this.prisma.coachingSession.findMany({
      where: { enrollment: { studentId: userId } },
      orderBy: { startsAt: 'asc' },
      take: 20,
    })

    const sessionDtos = coachingSessions.map((s) => ({
      id: s.id,
      title: s.title,
      coach: 'Your coach',
      courseTitle: undefined as string | undefined,
      date: formatDateLabel(s.startsAt),
      time: s.startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: `${s.durationMinutes} min`,
      type: s.type as '1:1' | 'group' | 'workshop',
      status: s.status === 'scheduled' ? ('upcoming' as const) : ('completed' as const),
      meetingLink: s.meetingUrl ?? '#',
      notes: s.notes ?? undefined,
    }))

    const calendarEvents = await this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startsAt: 'asc' },
      take: 30,
    })

    const calendarDtos = calendarEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      date: ev.startsAt.toISOString().slice(0, 10),
      time: ev.startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      type: ev.type as 'coaching' | 'live' | 'deadline' | 'batch' | 'quiz',
      courseTitle: undefined as string | undefined,
      location: ev.location ?? undefined,
    }))

    const threads = await this.prisma.threadParticipant.findMany({
      where: { userId },
      include: {
        thread: {
          include: {
            messages: { orderBy: { sentAt: 'desc' }, take: 1 },
          },
        },
      },
    })

    const messages = threads.map((tp) => {
      const msg = tp.thread.messages[0]
      return {
        id: tp.thread.id,
        from: 'Instructor',
        role: 'instructor' as const,
        subject: tp.thread.subject,
        preview: msg?.body.slice(0, 80) ?? '',
        body: msg?.body ?? '',
        time: msg ? relativeTime(msg.sentAt) : '',
        read: Boolean(msg?.readAt),
        courseTitle: undefined as string | undefined,
      }
    })

    const activeCourses = courses.filter((c) => c.status === 'active')
    const completedCourses = courses.filter((c) => c.status === 'completed')

    const progressDash = await this.progressService.getStudentDashboard(userId).catch(() => null)

    const overallProgress = progressDash?.overallProgress ??
      (activeCourses.length > 0
        ? Math.round(activeCourses.reduce((s, c) => s + c.progress, 0) / activeCourses.length)
        : completedCourses.length > 0
          ? 100
          : 0)

    const summary = {
      totalHours: progressDash?.totalHours ?? Math.round(courses.reduce((s, c) => s + c.hoursSpent, 0)),
      weeklyHours: progressDash?.weeklyHours ?? (activeCourses.length > 0 ? 8 : 0),
      weeklyGoal: (profile.preferences as { weeklyGoalHours?: number })?.weeklyGoalHours ?? 10,
      activeCourses: activeCourses.length,
      completedCourses: completedCourses.length,
      streak: progressDash?.streak ?? (activeCourses.length > 0 ? 5 : 0),
      longestStreak: progressDash?.longestStreak ?? (activeCourses.length > 0 ? 8 : 0),
      overallProgress,
      certificationsInProgress: activeCourses.filter(
        (c) => c.category.includes('Cloud') || c.category.includes('Data'),
      ).length,
      coachingSessionsThisMonth: sessionDtos.filter((s) => s.status === 'upcoming').length,
    }

    const weeklyLearning = progressDash?.weeklyActivity?.length
      ? progressDash.weeklyActivity
      : courses.length > 0
        ? [
            { day: 'Mon', hours: 1.5, active: true },
            { day: 'Tue', hours: 2, active: true },
            { day: 'Wed', hours: 0.5, active: true },
            { day: 'Thu', hours: 1.5, active: true },
            { day: 'Fri', hours: 2, active: true },
            { day: 'Sat', hours: 0.5, active: true },
            { day: 'Sun', hours: 0, active: false },
          ]
        : []

    const continueLearningItem = progressDash?.continueLearning?.[0]
    const continueLearning = continueLearningItem
      ? courses.find((c) => c.id === continueLearningItem.courseId) ?? courses
          .filter((c) => c.status === 'active')
          .sort((a, b) => b.progress - a.progress)[0]
      : [...courses]
          .filter((c) => c.status === 'active')
          .sort((a, b) => b.progress - a.progress)[0]

    const continueLearningWithLesson = continueLearning
      ? {
          ...continueLearning,
          nextLesson: continueLearningItem?.lessonTitle ?? continueLearning.nextLesson,
        }
      : undefined

    const upcomingActivities = assignmentDtos
      .filter((a) => a.status === 'pending' || a.status === 'overdue')
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.courseTitle,
        datetime: a.dueDate,
        type: 'assignment' as const,
        courseId: a.courseId,
      }))

    const unreadNotifications = notifications.filter((n) => !n.read).length
    const unreadMessages = messages.filter((m) => !m.read).length
    const pendingAssignments = assignmentDtos.filter(
      (a) => a.status === 'pending' || a.status === 'overdue',
    ).length

    return {
      profile: {
        id: userId,
        name: profile.displayName,
        email: user.email,
        phone: profile.phone ?? '',
        organization: profile.organizationLabel ?? '',
        title: profile.title ?? '',
        bio: profile.bio ?? '',
        avatarInitials: initials(profile.displayName),
        timezone: profile.timezone,
        memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
      courses,
      assignments: assignmentDtos,
      quizzes: quizDtos,
      certificates,
      notifications,
      milestones,
      upcomingActivities,
      calendarEvents: calendarDtos,
      batches,
      coachingSessions: sessionDtos,
      messages,
      weeklyLearning,
      summary,
      continueLearning: continueLearningWithLesson,
      unreadNotifications,
      unreadMessages,
      pendingAssignments,
      upcomingCoachingCount: sessionDtos.filter((s) => s.status === 'upcoming').length,
    }
  }

  private mapNotificationType(type: string): 'course' | 'announcement' | 'deadline' | 'coaching' | 'achievement' {
    const map: Record<string, 'course' | 'announcement' | 'deadline' | 'coaching' | 'achievement'> = {
      assignment: 'deadline',
      quiz: 'course',
      coaching: 'coaching',
      announcement: 'announcement',
      grade: 'achievement',
      enrollment: 'course',
      system: 'announcement',
      message: 'announcement',
    }
    return map[type] ?? 'announcement'
  }
}
