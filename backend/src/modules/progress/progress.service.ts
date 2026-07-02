import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  EnrollmentStatus,
  LearningActivityType,
  LessonProgressStatus,
  Prisma,
} from '@prisma/client'
import { UpdateLessonProgressDto } from '../../common/dto/progress.dto'
import { formatDateLabel } from '../../common/utils/course.util'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'
import { CertificatesService } from '../certificates/certificates.service'

type EnrollmentCtx = {
  id: string
  studentId: string
  courseId: string
  progressPct: number
  course: { slug: string; title: string; instructorId: string; organizationId: string }
}

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notificationMail: NotificationMailService,
    private certificatesService: CertificatesService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private async getEnrollmentForStudent(studentId: string, courseSlug: string): Promise<EnrollmentCtx> {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course) throw new NotFoundException('Course not found')

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
      include: { course: true },
    })
    if (!enrollment) throw new NotFoundException('Not enrolled in this course')

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      progressPct: enrollment.progressPct,
      course: {
        slug: course.slug,
        title: course.title,
        instructorId: course.instructorId,
        organizationId: course.organizationId,
      },
    }
  }

  private async getLessonInCourse(lessonId: string, courseId: string) {
    const lesson = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, module: { courseId } },
      include: { module: true },
    })
    if (!lesson) throw new NotFoundException('Lesson not found in this course')
    return lesson
  }

  private async logActivity(
    userId: string,
    type: LearningActivityType,
    data: { enrollmentId?: string; courseId?: string; lessonId?: string; metadata?: Record<string, unknown> },
  ) {
    await this.prisma.learningActivity.create({
      data: {
        userId,
        enrollmentId: data.enrollmentId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        type,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  }

  async ensureCourseProgress(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: { include: { lessons: true }, orderBy: { sortOrder: 'asc' } },
            assignments: { where: { status: 'published' } },
            quizzes: { where: { status: 'published' } },
          },
        },
      },
    })
    if (!enrollment) return null

    const totalLessons = enrollment.course.modules.reduce((s, m) => s + m.lessons.length, 0)
    const totalModules = enrollment.course.modules.length

    return this.prisma.courseProgress.upsert({
      where: { enrollmentId },
      create: {
        enrollmentId,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        totalLessons,
        totalModules,
        totalAssignments: enrollment.course.assignments.length,
        totalQuizzes: enrollment.course.quizzes.length,
        startedAt: enrollment.enrolledAt,
      },
      update: {
        totalLessons,
        totalModules,
        totalAssignments: enrollment.course.assignments.length,
        totalQuizzes: enrollment.course.quizzes.length,
      },
    })
  }

  async recalculateProgress(enrollmentId: string, trigger: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { include: { studentProfile: true } },
        course: {
          include: {
            modules: { include: { lessons: true }, orderBy: { sortOrder: 'asc' } },
            assignments: { where: { status: 'published' } },
            quizzes: { where: { status: 'published' } },
          },
        },
        lessonProgress: true,
        submissions: { where: { status: { in: ['submitted', 'graded', 'late'] } } },
        quizAttempts: { where: { status: { in: ['submitted', 'auto_graded', 'graded', 'pending_manual'] } } },
      },
    })
    if (!enrollment) return

    const previousPct = enrollment.progressPct
    const completedLessonIds = new Set(
      enrollment.lessonProgress
        .filter((lp) => lp.status === LessonProgressStatus.completed)
        .map((lp) => lp.lessonId),
    )

    let totalLessons = 0
    let lessonsCompleted = 0
    let modulesCompleted = 0

    for (const mod of enrollment.course.modules) {
      const modTotal = mod.lessons.length
      totalLessons += modTotal
      const modCompleted = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length
      lessonsCompleted += modCompleted

      const modPct = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0
      const remainingMins = mod.lessons
        .filter((l) => !completedLessonIds.has(l.id))
        .reduce((s, l) => s + (l.durationMinutes ?? 10), 0)

      if (modCompleted === modTotal && modTotal > 0) modulesCompleted++

      const existingMod = await this.prisma.moduleProgress.findUnique({
        where: { enrollmentId_moduleId: { enrollmentId, moduleId: mod.id } },
      })

      await this.prisma.moduleProgress.upsert({
        where: { enrollmentId_moduleId: { enrollmentId, moduleId: mod.id } },
        create: {
          enrollmentId,
          moduleId: mod.id,
          courseId: enrollment.courseId,
          completedLessons: modCompleted,
          totalLessons: modTotal,
          progressPct: modPct,
          estimatedMinutesRemaining: remainingMins,
          completedAt: modCompleted === modTotal && modTotal > 0 ? new Date() : null,
        },
        update: {
          completedLessons: modCompleted,
          totalLessons: modTotal,
          progressPct: modPct,
          estimatedMinutesRemaining: remainingMins,
          completedAt: modCompleted === modTotal && modTotal > 0 ? new Date() : undefined,
        },
      })

      if (
        modCompleted === modTotal &&
        modTotal > 0 &&
        existingMod &&
        existingMod.completedLessons < modTotal
      ) {
        void this.notificationMail.sendModuleCompleted({
          userId: enrollment.studentId,
          email: enrollment.student.email,
          name: enrollment.student.studentProfile?.displayName ?? enrollment.student.email,
          moduleTitle: mod.title,
          courseTitle: enrollment.course.title,
          organizationId: enrollment.course.organizationId,
        })
      }
    }

    const assignmentsCompleted = enrollment.submissions.length
    const quizzesCompleted = new Set(enrollment.quizAttempts.map((a) => a.quizId)).size
    const progressPct =
      totalLessons > 0 ? Math.min(100, Math.round((lessonsCompleted / totalLessons) * 100)) : 0

    const timeSpentSeconds = enrollment.lessonProgress.reduce(
      (s, lp) => s + lp.timeSpentSeconds,
      0,
    )

    const lastLessonProgress = await this.prisma.lessonProgress.findFirst({
      where: { enrollmentId },
      orderBy: { lastAccessedAt: 'desc' },
    })

    const now = new Date()
    const courseCompleted = progressPct >= 100 && totalLessons > 0

    await this.prisma.courseProgress.upsert({
      where: { enrollmentId },
      create: {
        enrollmentId,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        lessonsCompleted,
        totalLessons,
        modulesCompleted,
        totalModules: enrollment.course.modules.length,
        assignmentsCompleted,
        totalAssignments: enrollment.course.assignments.length,
        quizzesCompleted,
        totalQuizzes: enrollment.course.quizzes.length,
        progressPct,
        timeSpentSeconds,
        lastLessonId: lastLessonProgress?.lessonId,
        lastActivityAt: now,
        completedAt: courseCompleted ? now : null,
      },
      update: {
        lessonsCompleted,
        totalLessons,
        modulesCompleted,
        totalModules: enrollment.course.modules.length,
        assignmentsCompleted,
        totalAssignments: enrollment.course.assignments.length,
        quizzesCompleted,
        totalQuizzes: enrollment.course.quizzes.length,
        progressPct,
        timeSpentSeconds,
        lastLessonId: lastLessonProgress?.lessonId,
        lastActivityAt: now,
        completedAt: courseCompleted ? now : undefined,
      },
    })

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPct,
        modulesCompleted,
        hoursSpent: Math.round((timeSpentSeconds / 3600) * 10) / 10,
        lastAccessedAt: now,
        lastLessonId: lastLessonProgress?.lessonId,
        status: courseCompleted ? EnrollmentStatus.completed : EnrollmentStatus.active,
        completedAt: courseCompleted ? now : undefined,
      },
    })

    if (progressPct !== previousPct) {
      await this.prisma.progressHistory.create({
        data: {
          enrollmentId,
          progressPct,
          previousPct,
          trigger,
          snapshot: {
            lessonsCompleted,
            totalLessons,
            modulesCompleted,
            assignmentsCompleted,
            quizzesCompleted,
          } as Prisma.InputJsonValue,
        },
      })
    }

    if (courseCompleted && previousPct < 100) {
      void this.notificationMail.sendCourseCompleted({
        userId: enrollment.studentId,
        email: enrollment.student.email,
        name: enrollment.student.studentProfile?.displayName ?? enrollment.student.email,
        courseTitle: enrollment.course.title,
        organizationId: enrollment.course.organizationId,
      })
      void this.certificatesService.tryAutoIssue(enrollmentId)
    } else if (progressPct >= 100 || enrollment.progressPct >= 100) {
      void this.certificatesService.tryAutoIssue(enrollmentId)
    }
  }

  async markLessonComplete(studentId: string, lessonId: string, courseSlug: string) {
    const enrollment = await this.getEnrollmentForStudent(studentId, courseSlug)
    const lesson = await this.getLessonInCourse(lessonId, enrollment.courseId)

    await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        moduleId: lesson.moduleId,
        courseId: enrollment.courseId,
        status: LessonProgressStatus.completed,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        videoProgressPct: lesson.type === 'video' ? 100 : 0,
      },
      update: {
        status: LessonProgressStatus.completed,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        videoProgressPct: lesson.type === 'video' ? 100 : undefined,
      },
    })

    await this.logActivity(studentId, LearningActivityType.lesson_completed, {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      lessonId,
    })

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true },
    })
    void this.notificationMail.sendLessonCompleted({
      userId: studentId,
      email: student!.email,
      name: student!.studentProfile?.displayName ?? student!.email,
      lessonTitle: lesson.title,
      courseTitle: enrollment.course.title,
      organizationId: enrollment.course.organizationId,
    })

    await this.recalculateProgress(enrollment.id, 'lesson_completed')
    return this.getCourseProgress(studentId, courseSlug)
  }

  async markLessonIncomplete(studentId: string, lessonId: string, courseSlug: string) {
    const enrollment = await this.getEnrollmentForStudent(studentId, courseSlug)
    await this.getLessonInCourse(lessonId, enrollment.courseId)

    await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        moduleId: (await this.getLessonInCourse(lessonId, enrollment.courseId)).moduleId,
        courseId: enrollment.courseId,
        status: LessonProgressStatus.in_progress,
        completedAt: null,
      },
      update: {
        status: LessonProgressStatus.in_progress,
        completedAt: null,
      },
    })

    await this.logActivity(studentId, LearningActivityType.lesson_incomplete, {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      lessonId,
    })

    await this.recalculateProgress(enrollment.id, 'lesson_incomplete')
    return this.getCourseProgress(studentId, courseSlug)
  }

  async updateLessonProgress(
    studentId: string,
    lessonId: string,
    courseSlug: string,
    dto: UpdateLessonProgressDto,
  ) {
    const enrollment = await this.getEnrollmentForStudent(studentId, courseSlug)
    const lesson = await this.getLessonInCourse(lessonId, enrollment.courseId)
    const now = new Date()

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    })

    const autoComplete =
      dto.videoProgressPct != null &&
      dto.videoProgressPct >= 90 &&
      lesson.type === 'video'

    await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        moduleId: lesson.moduleId,
        courseId: enrollment.courseId,
        status: autoComplete ? LessonProgressStatus.completed : LessonProgressStatus.in_progress,
        videoProgressPct: dto.videoProgressPct ?? 0,
        timeSpentSeconds: dto.timeSpentSeconds ?? 0,
        resourceDownloaded: dto.resourceDownloaded ?? false,
        visitCount: dto.recordAccess !== false ? 1 : 0,
        lastAccessedAt: now,
        completedAt: autoComplete ? now : null,
      },
      update: {
        status: autoComplete
          ? LessonProgressStatus.completed
          : existing?.status === LessonProgressStatus.completed
            ? LessonProgressStatus.completed
            : LessonProgressStatus.in_progress,
        videoProgressPct: dto.videoProgressPct ?? undefined,
        timeSpentSeconds: dto.timeSpentSeconds
          ? { increment: dto.timeSpentSeconds }
          : undefined,
        resourceDownloaded: dto.resourceDownloaded ?? undefined,
        visitCount: dto.recordAccess !== false ? { increment: 1 } : undefined,
        lastAccessedAt: now,
        completedAt: autoComplete ? now : undefined,
      },
    })

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastLessonId: lessonId, lastAccessedAt: now },
    })

    if (dto.recordAccess !== false) {
      await this.logActivity(studentId, LearningActivityType.lesson_started, {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        lessonId,
      })
    }
    if (dto.videoProgressPct != null) {
      await this.logActivity(studentId, LearningActivityType.video_progress, {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        lessonId,
        metadata: { pct: dto.videoProgressPct },
      })
    }
    if (dto.resourceDownloaded) {
      await this.logActivity(studentId, LearningActivityType.resource_download, {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        lessonId,
      })
    }

    await this.recalculateProgress(enrollment.id, 'lesson_update')
    return this.getLessonProgress(studentId, lessonId, courseSlug)
  }

  async getLessonProgress(studentId: string, lessonId: string, courseSlug: string) {
    const enrollment = await this.getEnrollmentForStudent(studentId, courseSlug)
    const lesson = await this.getLessonInCourse(lessonId, enrollment.courseId)
    const progress = await this.prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    })

    return {
      lessonId,
      title: lesson.title,
      type: lesson.type,
      moduleId: lesson.moduleId,
      status: progress?.status ?? 'not_started',
      videoProgressPct: progress?.videoProgressPct ?? 0,
      timeSpentSeconds: progress?.timeSpentSeconds ?? 0,
      resourceDownloaded: progress?.resourceDownloaded ?? false,
      completedAt: progress?.completedAt?.toISOString() ?? null,
      lastAccessedAt: progress?.lastAccessedAt?.toISOString() ?? null,
    }
  }

  async getCourseProgress(studentId: string, courseSlug: string) {
    const enrollment = await this.getEnrollmentForStudent(studentId, courseSlug)
    await this.ensureCourseProgress(enrollment.id)

    const full = await this.prisma.enrollment.findUnique({
      where: { id: enrollment.id },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { sortOrder: 'asc' },
              include: { lessons: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
        lessonProgress: true,
        moduleProgress: true,
        courseProgress: true,
        milestones: true,
      },
    })
    if (!full) throw new NotFoundException('Enrollment not found')

    const lpMap = new Map(full.lessonProgress.map((lp) => [lp.lessonId, lp]))
    const mpMap = new Map(full.moduleProgress.map((mp) => [mp.moduleId, mp]))

    return {
      courseId: full.course.slug,
      courseTitle: full.course.title,
      status: full.status,
      progressPct: full.progressPct,
      modulesCompleted: full.modulesCompleted,
      hoursSpent: full.hoursSpent,
      enrolledAt: formatDateLabel(full.enrolledAt),
      lastAccessedAt: full.lastAccessedAt ? formatDateLabel(full.lastAccessedAt) : null,
      completedAt: full.completedAt ? formatDateLabel(full.completedAt) : null,
      courseProgress: full.courseProgress,
      modules: full.course.modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        sortOrder: mod.sortOrder,
        progressPct: mpMap.get(mod.id)?.progressPct ?? 0,
        completedLessons: mpMap.get(mod.id)?.completedLessons ?? 0,
        totalLessons: mod.lessons.length,
        estimatedMinutesRemaining: mpMap.get(mod.id)?.estimatedMinutesRemaining ?? null,
        completedAt: mpMap.get(mod.id)?.completedAt?.toISOString() ?? null,
        lessons: mod.lessons.map((lesson) => {
          const lp = lpMap.get(lesson.id)
          return {
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            sortOrder: lesson.sortOrder,
            durationMinutes: lesson.durationMinutes,
            status: lp?.status ?? 'not_started',
            videoProgressPct: lp?.videoProgressPct ?? 0,
            completedAt: lp?.completedAt?.toISOString() ?? null,
          }
        }),
      })),
      milestones: full.milestones.map((m) => ({
        id: m.id,
        phase: m.phase,
        title: m.title,
        description: m.description ?? '',
        status: m.status,
        completedAt: m.completedAt ? formatDateLabel(m.completedAt) : null,
      })),
    }
  }

  async getStudentDashboard(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: { not: EnrollmentStatus.withdrawn } },
      include: {
        course: { include: { modules: true } },
        courseProgress: true,
        lastLesson: true,
      },
      orderBy: { lastAccessedAt: 'desc' },
    })

    const activities = await this.prisma.learningActivity.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const streak = this.computeStreak(activities)
    const weeklyActivity = this.computeWeeklyActivity(activities)
    const monthlyActivity = this.computeMonthlyActivity(activities)

    const active = enrollments.filter((e) => e.status === 'active')
    const overallProgress =
      active.length > 0
        ? Math.round(active.reduce((s, e) => s + e.progressPct, 0) / active.length)
        : 0

    const continueLearning = enrollments
      .filter((e) => e.lastLessonId && e.status === 'active')
      .slice(0, 3)
      .map((e) => ({
        courseId: e.course.slug,
        courseTitle: e.course.title,
        lessonId: e.lastLessonId,
        lessonTitle: e.lastLesson?.title ?? 'Continue learning',
        progressPct: e.progressPct,
      }))

    const recentCourses = enrollments.slice(0, 5).map((e) => ({
      courseId: e.course.slug,
      title: e.course.title,
      progressPct: e.progressPct,
      lastAccessedAt: e.lastAccessedAt?.toISOString() ?? null,
    }))

    const pendingAssignments = await this.prisma.assignment.count({
      where: {
        courseId: { in: enrollments.map((e) => e.courseId) },
        status: 'published',
        submissions: { none: { enrollment: { studentId } } },
      },
    })

    const pendingQuizzes = await this.prisma.quiz.count({
      where: {
        courseId: { in: enrollments.map((e) => e.courseId) },
        status: 'published',
        attempts: { none: { enrollment: { studentId } } },
      },
    })

    const upcomingDeadlines = await this.prisma.assignment.findMany({
      where: {
        courseId: { in: enrollments.map((e) => e.courseId) },
        status: 'published',
        dueAt: { gte: new Date() },
      },
      orderBy: { dueAt: 'asc' },
      take: 5,
      include: { course: true },
    })

    return {
      overallProgress,
      streak,
      longestStreak: streak,
      weeklyActivity,
      monthlyActivity,
      totalHours: Math.round(enrollments.reduce((s, e) => s + e.hoursSpent, 0)),
      weeklyHours: weeklyActivity.reduce((s, d) => s + d.hours, 0),
      continueLearning,
      recentCourses,
      pendingAssignments,
      pendingQuizzes,
      upcomingDeadlines: upcomingDeadlines.map((a) => ({
        id: a.id,
        title: a.title,
        courseTitle: a.course.title,
        dueAt: a.dueAt?.toISOString() ?? null,
      })),
    }
  }

  private computeStreak(activities: Array<{ createdAt: Date }>) {
    if (!activities.length) return 0
    const days = new Set(activities.map((a) => a.createdAt.toISOString().slice(0, 10)))
    let streak = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10)
      if (days.has(key)) streak++
      else if (i > 0) break
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  private computeWeeklyActivity(activities: Array<{ createdAt: Date; metadata: unknown }>) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const buckets = days.map((day) => ({ day, hours: 0, active: false }))
    for (const a of activities) {
      if (a.createdAt < start) continue
      const idx = a.createdAt.getDay()
      const meta = a.metadata as { seconds?: number }
      buckets[idx].hours += (meta?.seconds ?? 1800) / 3600
      buckets[idx].active = true
    }
    return buckets.map((b) => ({ ...b, hours: Math.round(b.hours * 10) / 10 }))
  }

  private computeMonthlyActivity(activities: Array<{ createdAt: Date }>) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return activities.filter((a) => a.createdAt >= start).length
  }

  async onAssignmentSubmitted(enrollmentId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { lesson: true },
    })
    if (!assignment) return

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true },
    })
    if (!enrollment) return

    await this.logActivity(enrollment.studentId, LearningActivityType.assignment_submitted, {
      enrollmentId,
      courseId: assignment.courseId,
      lessonId: assignment.lessonId ?? undefined,
      metadata: { assignmentId },
    })

    if (assignment.lessonId) {
      let moduleId = assignment.moduleId ?? assignment.lesson?.moduleId
      if (!moduleId) {
        const lesson = await this.prisma.courseLesson.findUnique({
          where: { id: assignment.lessonId },
        })
        moduleId = lesson?.moduleId ?? undefined
      }
      if (moduleId) {
        await this.prisma.lessonProgress.upsert({
          where: {
            enrollmentId_lessonId: { enrollmentId, lessonId: assignment.lessonId },
          },
          create: {
            enrollmentId,
            lessonId: assignment.lessonId,
            moduleId,
            courseId: assignment.courseId,
            status: LessonProgressStatus.completed,
            completedAt: new Date(),
            lastAccessedAt: new Date(),
          },
          update: {
            status: LessonProgressStatus.completed,
            completedAt: new Date(),
            lastAccessedAt: new Date(),
          },
        })
      }
    }

    await this.recalculateProgress(enrollmentId, 'assignment_submitted')
  }

  async onQuizSubmitted(enrollmentId: string, quizId: string, passed: boolean) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } })
    if (!quiz) return

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    })
    if (!enrollment) return

    await this.logActivity(enrollment.studentId, LearningActivityType.quiz_submitted, {
      enrollmentId,
      courseId: quiz.courseId ?? undefined,
      lessonId: quiz.lessonId ?? undefined,
      metadata: { quizId, passed },
    })

    if (passed) {
      await this.logActivity(enrollment.studentId, LearningActivityType.quiz_passed, {
        enrollmentId,
        courseId: quiz.courseId ?? undefined,
        metadata: { quizId },
      })
    }

    const requirePass = this.config.get<string>('QUIZ_PROGRESS_REQUIRE_PASS') === 'true'
    const shouldComplete = !requirePass || passed

    if (shouldComplete && quiz.lessonId && quiz.courseId) {
      const lesson = await this.prisma.courseLesson.findUnique({
        where: { id: quiz.lessonId },
      })
      if (lesson) {
        await this.prisma.lessonProgress.upsert({
          where: { enrollmentId_lessonId: { enrollmentId, lessonId: quiz.lessonId } },
          create: {
            enrollmentId,
            lessonId: quiz.lessonId,
            moduleId: lesson.moduleId,
            courseId: quiz.courseId,
            status: LessonProgressStatus.completed,
            completedAt: new Date(),
            lastAccessedAt: new Date(),
          },
          update: {
            status: LessonProgressStatus.completed,
            completedAt: new Date(),
            lastAccessedAt: new Date(),
          },
        })
      }
    }

    await this.recalculateProgress(enrollmentId, 'quiz_submitted')
  }

  async getInstructorCourseAnalytics(instructorId: string, courseSlug: string) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
      include: { modules: { include: { lessons: true } } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new NotFoundException('Course not found')
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: course.id, status: { not: EnrollmentStatus.withdrawn } },
      include: { courseProgress: true, student: { include: { studentProfile: true } } },
    })

    const progresses = enrollments.map((e) => e.progressPct)
    const avg = progresses.length
      ? progresses.reduce((a, b) => a + b, 0) / progresses.length
      : 0
    const completed = enrollments.filter((e) => e.status === 'completed').length
    const atRisk = enrollments.filter((e) => e.progressPct < 30 && e.status === 'active')

    const lessonVisits = await this.prisma.learningActivity.groupBy({
      by: ['lessonId'],
      where: { courseId: course.id, lessonId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    return {
      courseId: course.slug,
      title: course.title,
      totalStudents: enrollments.length,
      averageProgress: Math.round(avg),
      completionRate: enrollments.length
        ? Math.round((completed / enrollments.length) * 100)
        : 0,
      activeLearners: enrollments.filter(
        (e) =>
          e.lastAccessedAt &&
          e.lastAccessedAt > new Date(Date.now() - 7 * 86400000),
      ).length,
      studentsFallingBehind: atRisk.map((e) => ({
        studentId: e.studentId,
        name: e.student.studentProfile?.displayName ?? e.student.email,
        progressPct: e.progressPct,
        lastAccessedAt: e.lastAccessedAt?.toISOString() ?? null,
      })),
      mostRevisitedLessons: lessonVisits.map((v) => ({
        lessonId: v.lessonId,
        visitCount: v._count.id,
      })),
    }
  }

  async getInstructorStudentProgress(
    instructorId: string,
    courseSlug: string,
    studentId: string,
  ) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied')
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
    })
    if (!enrollment) throw new NotFoundException('Student not enrolled')

    return this.getCourseProgress(studentId, courseSlug)
  }
}
