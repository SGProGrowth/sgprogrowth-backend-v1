import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EnrollmentStatus, UserRole } from '@prisma/client'
import { AnalyticsFilterDto } from '../../common/dto/analytics.dto'
import { CacheService } from '../../cache/cache.service'
import { PrismaService } from '../../prisma/prisma.module'
import { ProgressService } from '../progress/progress.service'
import { QuizzesService } from '../quizzes/quizzes.service'

function parseRange(filter: AnalyticsFilterDto) {
  const to = filter.to ? new Date(filter.to) : new Date()
  const from = filter.from
    ? new Date(filter.from)
    : new Date(to.getTime() - 90 * 86400000)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private progressService: ProgressService,
    private quizzesService: QuizzesService,
    private cache: CacheService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private computeMonthlySeries(activities: Array<{ createdAt: Date; metadata: unknown }>, months = 6) {
    const now = new Date()
    const series: Array<{ month: string; hours: number; sessions: number }> = []
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const label = start.toLocaleDateString('en-US', { month: 'short' })
      const inMonth = activities.filter((a) => a.createdAt >= start && a.createdAt <= end)
      const hours = inMonth.reduce((s, a) => {
        const meta = a.metadata as { seconds?: number }
        return s + (meta?.seconds ?? 1800) / 3600
      }, 0)
      series.push({ month: label, hours: Math.round(hours * 10) / 10, sessions: inMonth.length })
    }
    return series
  }

  async getStudentAnalytics(studentId: string) {
    const dashboard = await this.progressService.getStudentDashboard(studentId)
    const quizAnalytics = await this.quizzesService.getStudentAnalytics(studentId)

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: { not: EnrollmentStatus.withdrawn } },
      include: {
        course: true,
        courseProgress: true,
        lessonProgress: { include: { lesson: true } },
      },
    })

    const activities = await this.prisma.learningActivity.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const monthlyActivity = this.computeMonthlySeries(activities)

    const courseStats = enrollments.map((e) => ({
      courseId: e.course.slug,
      title: e.course.title,
      progressPct: e.progressPct,
      status: e.status,
      hoursSpent: e.hoursSpent,
      timeSpentSeconds: e.courseProgress?.timeSpentSeconds ?? e.hoursSpent * 3600,
      completedAt: e.completedAt?.toISOString() ?? null,
      modulesCompleted: e.modulesCompleted,
    }))

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { enrollment: { studentId } },
      include: { assignment: { include: { course: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    })

    const assignmentTrend = submissions
      .filter((s) => s.score != null)
      .slice(0, 10)
      .reverse()
      .map((s) => ({
        id: s.id,
        title: s.assignment.title,
        courseTitle: s.assignment.course.title,
        score: s.score,
        maxScore: s.assignment.maxScore,
        submittedAt: s.submittedAt?.toISOString() ?? null,
      }))

    const quizResults = await this.prisma.quizResult.findMany({
      where: { enrollment: { studentId } },
      include: { quiz: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    })

    const quizTrend = [...quizResults].reverse().map((r) => ({
      id: r.id,
      title: r.quiz.title,
      percentage: r.percentage,
      passed: r.passed,
      submittedAt: r.submittedAt.toISOString(),
    }))

    const certificates = await this.prisma.certificate.findMany({
      where: { enrollment: { studentId }, status: 'active' },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    })

    return {
      ...dashboard,
      monthlyActivityChart: monthlyActivity,
      courseCompletion: courseStats,
      timePerCourse: courseStats.map((c) => ({
        courseId: c.courseId,
        title: c.title,
        hours: Math.round((c.timeSpentSeconds / 3600) * 10) / 10,
      })),
      assignmentPerformance: {
        submitted: submissions.length,
        graded: submissions.filter((s) => s.status === 'graded').length,
        averageScore:
          submissions.filter((s) => s.score != null).length > 0
            ? Math.round(
                submissions.filter((s) => s.score != null).reduce((s, x) => s + (x.score ?? 0), 0) /
                  submissions.filter((s) => s.score != null).length,
              )
            : 0,
        trend: assignmentTrend,
      },
      quizPerformance: { ...quizAnalytics, trend: quizTrend },
      certificates: certificates.map((c) => ({
        id: c.id,
        credentialId: c.credentialId,
        courseTitle: c.course?.title ?? c.title,
        issuedAt: c.issuedAt.toISOString(),
      })),
    }
  }

  async getStudentWidgets(studentId: string) {
    const dash = await this.progressService.getStudentDashboard(studentId)
    const certCount = await this.prisma.certificate.count({
      where: { enrollment: { studentId }, status: 'active' },
    })

    const recentActivity = await this.prisma.learningActivity.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { course: true },
    })

    return {
      progressCards: {
        overallProgress: dash.overallProgress,
        streak: dash.streak,
        totalHours: dash.totalHours,
        weeklyHours: dash.weeklyHours,
        pendingAssignments: dash.pendingAssignments,
        pendingQuizzes: dash.pendingQuizzes,
      },
      upcomingDeadlines: dash.upcomingDeadlines,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        courseTitle: a.course?.title,
        createdAt: a.createdAt.toISOString(),
      })),
      learningStreak: dash.streak,
      certificatesEarned: certCount,
      continueLearning: dash.continueLearning,
      recentlyAccessed: dash.recentCourses,
    }
  }

  async getStudentCourseTime(studentId: string, courseSlug: string) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
      include: { modules: { include: { lessons: true }, orderBy: { sortOrder: 'asc' } } },
    })
    if (!course) throw new NotFoundException('Course not found')

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
      include: { lessonProgress: true, courseProgress: true },
    })
    if (!enrollment) throw new NotFoundException('Not enrolled')

    const progressMap = new Map(enrollment.lessonProgress.map((lp) => [lp.lessonId, lp]))

    return {
      courseId: course.slug,
      title: course.title,
      totalHours: Math.round(((enrollment.courseProgress?.timeSpentSeconds ?? 0) / 3600) * 10) / 10,
      lessons: course.modules.flatMap((m) =>
        m.lessons.map((l) => {
          const lp = progressMap.get(l.id)
          return {
            lessonId: l.id,
            moduleTitle: m.title,
            title: l.title,
            timeSpentSeconds: lp?.timeSpentSeconds ?? 0,
            status: lp?.status ?? 'not_started',
          }
        }),
      ),
    }
  }

  private async instructorCourseIds(instructorId: string, filter: AnalyticsFilterDto) {
    const orgId = await this.defaultOrgId()
    if (filter.courseSlug) {
      const course = await this.prisma.course.findFirst({
        where: { organizationId: orgId, slug: filter.courseSlug, instructorId },
      })
      if (!course) throw new ForbiddenException('Course access denied')
      return [course.id]
    }
    const courses = await this.prisma.course.findMany({
      where: { organizationId: orgId, instructorId },
      select: { id: true },
    })
    return courses.map((c) => c.id)
  }

  async getInstructorAnalytics(instructorId: string, filter: AnalyticsFilterDto) {
    const { from, to } = parseRange(filter)
    const courseIds = await this.instructorCourseIds(instructorId, filter)

    const enrollmentWhere: Record<string, unknown> = {
      courseId: { in: courseIds },
      status: { not: EnrollmentStatus.withdrawn },
      enrolledAt: { gte: from, lte: to },
    }
    if (filter.batchId) enrollmentWhere.batchId = filter.batchId

    const enrollments = await this.prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: { student: { include: { studentProfile: true } }, course: true },
    })

    const activeCutoff = new Date(Date.now() - 7 * 86400000)
    const activeStudents = enrollments.filter(
      (e) => e.lastAccessedAt && e.lastAccessedAt >= activeCutoff,
    ).length
    const atRisk = enrollments.filter((e) => e.progressPct < 30 && e.status === 'active')

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, status: 'published' },
      include: { submissions: true },
    })
    const totalAssignmentSlots = assignments.length * Math.max(enrollments.length, 1)
    const completedAssignments = assignments.reduce(
      (s, a) => s + a.submissions.filter((sub) => ['submitted', 'graded', 'late'].includes(sub.status)).length,
      0,
    )

    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId: { in: courseIds }, status: 'published' },
      include: { attempts: true },
    })
    const completedQuizzes = quizzes.reduce(
      (s, q) => s + q.attempts.filter((a) => ['submitted', 'graded', 'auto_graded'].includes(a.status)).length,
      0,
    )
    const totalQuizSlots = quizzes.length * Math.max(enrollments.length, 1)

    const quizResults = await this.prisma.quizResult.findMany({
      where: { quiz: { courseId: { in: courseIds } }, submittedAt: { gte: from, lte: to } },
    })
    const avgQuizScore =
      quizResults.length > 0
        ? Math.round(quizResults.reduce((s, r) => s + r.percentage, 0) / quizResults.length)
        : 0

    const gradedSubs = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignment: { courseId: { in: courseIds } },
        status: 'graded',
        score: { not: null },
        submittedAt: { gte: from, lte: to },
      },
    })
    const avgAssignmentScore =
      gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((s, x) => s + (x.score ?? 0), 0) / gradedSubs.length)
        : 0

    const completedCount = enrollments.filter((e) => e.status === 'completed').length
    const courseCompletionRate = enrollments.length
      ? Math.round((completedCount / enrollments.length) * 100)
      : 0

    const batches = await this.prisma.batch.findMany({
      where: {
        courseId: { in: courseIds },
        OR: [{ instructorId }, { instructors: { some: { instructorId } } }],
        ...(filter.batchId ? { id: filter.batchId } : {}),
      },
      include: { batchEnrollments: true, course: true },
    })

    const batchPerformance = batches.map((b) => ({
      id: b.id,
      name: b.name,
      courseTitle: b.course.title,
      studentsCount: b.batchEnrollments.filter((e) => e.status !== 'dropped').length,
      completionRate: Math.round(b.completionRate),
      avgProgress:
        b.batchEnrollments.length > 0
          ? Math.round(
              enrollments
                .filter((e) => e.batchId === b.id)
                .reduce((s, e) => s + e.progressPct, 0) / Math.max(enrollments.filter((e) => e.batchId === b.id).length, 1),
            )
          : 0,
    }))

    const certificatesIssued = await this.prisma.certificate.count({
      where: {
        courseId: { in: courseIds },
        issuedAt: { gte: from, lte: to },
        status: 'active',
      },
    })

    const coachingSessions = await this.prisma.coachingSession.count({
      where: {
        enrollment: { courseId: { in: courseIds } },
        startsAt: { gte: from, lte: to },
        status: 'completed',
      },
    })

    const enrollmentTrend = await this.buildEnrollmentTrend(courseIds, 6)
    const completionTrend = await this.buildCompletionTrend(courseIds, 6)

    return {
      totalStudents: enrollments.length,
      activeStudents,
      studentsAtRisk: atRisk.length,
      studentsAtRiskList: atRisk.slice(0, 10).map((e) => ({
        studentId: e.studentId,
        name: e.student.studentProfile?.displayName ?? e.student.email,
        courseTitle: e.course.title,
        progressPct: e.progressPct,
      })),
      assignmentCompletionRate: totalAssignmentSlots
        ? Math.round((completedAssignments / totalAssignmentSlots) * 100)
        : 0,
      quizCompletionRate: totalQuizSlots
        ? Math.round((completedQuizzes / totalQuizSlots) * 100)
        : 0,
      averageQuizScore: avgQuizScore,
      averageAssignmentScore: avgAssignmentScore,
      courseCompletionRate,
      engagementRate: enrollments.length
        ? Math.round((activeStudents / enrollments.length) * 100)
        : 0,
      attendanceSummary: {
        coachingSessionsCompleted: coachingSessions,
        batchEvents: await this.prisma.batchEvent.count({
          where: { batch: { courseId: { in: courseIds } }, startsAt: { gte: from, lte: to } },
        }),
      },
      certificatesIssued,
      batchPerformance,
      enrollmentTrend,
      completionTrend,
      filters: { courseSlug: filter.courseSlug, batchId: filter.batchId, from: from.toISOString(), to: to.toISOString() },
    }
  }

  private async buildEnrollmentTrend(courseIds: string[], months: number) {
    const now = new Date()
    const trend: Array<{ month: string; count: number }> = []
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const count = await this.prisma.enrollment.count({
        where: { courseId: { in: courseIds }, enrolledAt: { gte: start, lte: end } },
      })
      trend.push({
        month: start.toLocaleDateString('en-US', { month: 'short' }),
        count,
      })
    }
    return trend
  }

  private async buildCompletionTrend(courseIds: string[], months: number) {
    const now = new Date()
    const trend: Array<{ month: string; rate: number }> = []
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const total = await this.prisma.enrollment.count({
        where: { courseId: { in: courseIds }, enrolledAt: { lte: end } },
      })
      const completed = await this.prisma.enrollment.count({
        where: {
          courseId: { in: courseIds },
          status: 'completed',
          completedAt: { gte: start, lte: end },
        },
      })
      trend.push({
        month: start.toLocaleDateString('en-US', { month: 'short' }),
        rate: total ? Math.round((completed / total) * 100) : 0,
      })
    }
    return trend
  }

  async getInstructorWidgets(instructorId: string) {
    const cacheKey = `instructor-widgets:${instructorId}`
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey)
    if (cached) return cached

    const courseIds = (
      await this.prisma.course.findMany({
        where: { instructorId },
        select: { id: true },
      })
    ).map((c) => c.id)

    const studentsEnrolled = await this.prisma.enrollment.count({
      where: { courseId: { in: courseIds }, status: { not: 'withdrawn' } },
    })

    const activeBatches = await this.prisma.batch.count({
      where: {
        courseId: { in: courseIds },
        status: 'active',
        OR: [{ instructorId }, { instructors: { some: { instructorId } } }],
      },
    })

    const pendingGrading = await this.prisma.assignmentSubmission.count({
      where: {
        assignment: { courseId: { in: courseIds } },
        status: 'submitted',
      },
    })

    const upcomingSessions = await this.prisma.coachingSession.findMany({
      where: {
        enrollment: { courseId: { in: courseIds } },
        startsAt: { gte: new Date() },
        status: 'scheduled',
      },
      orderBy: { startsAt: 'asc' },
      take: 5,
      include: { enrollment: { include: { student: { include: { studentProfile: true } } } } },
    })

    const summary = await this.getInstructorAnalytics(instructorId, {})

    const result = {
      studentsEnrolled,
      activeBatches,
      pendingGrading,
      upcomingSessions: upcomingSessions.map((s) => ({
        id: s.id,
        title: s.title,
        startsAt: s.startsAt.toISOString(),
        studentName: s.enrollment
          ? s.enrollment.student.studentProfile?.displayName ?? s.enrollment.student.email
          : 'Group session',
      })),
      analyticsSummary: {
        engagementRate: summary.engagementRate,
        courseCompletionRate: summary.courseCompletionRate,
        studentsAtRisk: summary.studentsAtRisk,
        certificatesIssued: summary.certificatesIssued,
      },
    }
    await this.cache.set(cacheKey, result, 300)
    return result
  }

  async getInstructorHeatmap(instructorId: string, courseSlug?: string) {
    const filter: AnalyticsFilterDto = { courseSlug }
    const courseIds = await this.instructorCourseIds(instructorId, filter)

    const activities = await this.prisma.learningActivity.findMany({
      where: { courseId: { in: courseIds } },
      select: { createdAt: true },
      take: 5000,
    })

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const grid = days.map((day) => ({
      day,
      hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
    }))

    for (const a of activities) {
      const d = a.createdAt.getDay()
      const h = a.createdAt.getHours()
      grid[d].hours[h].count++
    }

    return { grid, totalActivities: activities.length }
  }

  async getInstructorOverviewForWorkspace(instructorId: string) {
    const analytics = await this.getInstructorAnalytics(instructorId, {})
    const courses = await this.prisma.course.findMany({
      where: { instructorId, status: 'published' },
      include: { _count: { select: { enrollments: true } } },
      take: 3,
      orderBy: { updatedAt: 'desc' },
    })

    return {
      enrollmentTrend: analytics.enrollmentTrend.map((t) => t.count),
      completionTrend: analytics.completionTrend.map((t) => t.rate),
      revenueTrend: analytics.enrollmentTrend.map((t) => t.count * 1200),
      engagementRate: analytics.engagementRate,
      avgSessionRating: 4.8,
      topCourses: courses.map((c) => ({
        id: c.slug,
        title: c.title,
        students: c._count.enrollments,
        completion: analytics.courseCompletionRate,
        rating: c.ratingAvg,
      })),
    }
  }

  async getAdminOrgAnalytics(userId: string, organizationId: string, filter: AnalyticsFilterDto) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    })
    if (!member) throw new ForbiddenException('Organization access denied')

    const { from, to } = parseRange(filter)
    const [students, courses, enrollments, certificates] = await Promise.all([
      this.prisma.enrollment.groupBy({
        by: ['studentId'],
        where: { organizationId, enrolledAt: { gte: from, lte: to } },
      }),
      this.prisma.course.count({ where: { organizationId } }),
      this.prisma.enrollment.count({ where: { organizationId, enrolledAt: { gte: from, lte: to } } }),
      this.prisma.certificate.count({
        where: { organizationId, issuedAt: { gte: from, lte: to }, status: 'active' },
      }),
    ])

    return {
      uniqueStudents: students.length,
      totalCourses: courses,
      newEnrollments: enrollments,
      certificatesIssued: certificates,
      period: { from: from.toISOString(), to: to.toISOString() },
    }
  }

  assertAdminRole(roles: UserRole[]) {
    if (!roles.some((r) => r === UserRole.org_admin || r === UserRole.platform_admin)) {
      throw new ForbiddenException('Admin access required')
    }
  }
}
