import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  BatchEnrollmentStatus,
  BatchInstructorRole,
  BatchStatus,
  EnrollmentStatus,
  Prisma,
  UserRole,
} from '@prisma/client'
import { randomBytes } from 'crypto'
import {
  AddBatchStudentDto,
  AssignBatchInstructorDto,
  CreateBatchDto,
  CreateBatchEventDto,
  TransferBatchStudentDto,
  UpdateBatchDto,
} from '../../common/dto/batch.dto'
import { formatDateLabel } from '../../common/utils/course.util'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'

@Injectable()
export class BatchesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notificationMail: NotificationMailService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private formatDate(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  private generateBatchCode(name: string) {
    const prefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
    return `${prefix || 'BAT'}-${randomBytes(3).toString('hex').toUpperCase()}`
  }

  async assertInstructorBatchAccess(instructorId: string, batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { instructors: true, course: true },
    })
    if (!batch) throw new NotFoundException('Batch not found')
    const allowed =
      batch.instructorId === instructorId ||
      batch.instructors.some((i) => i.instructorId === instructorId)
    if (!allowed) throw new ForbiddenException('Access denied')
    return batch
  }

  async assertStudentBatchAccess(studentId: string, batchId: string) {
    const be = await this.prisma.batchEnrollment.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
      include: { batch: { include: { course: true } } },
    })
    if (!be || be.status === BatchEnrollmentStatus.dropped) {
      throw new ForbiddenException('Access denied')
    }
    return be
  }

  private async activeEnrollmentCount(batchId: string) {
    return this.prisma.batchEnrollment.count({
      where: { batchId, status: { in: [BatchEnrollmentStatus.active, BatchEnrollmentStatus.completed] } },
    })
  }

  private mapBatch(
    batch: {
      id: string
      batchCode: string
      name: string
      description: string | null
      startDate: Date
      endDate: Date | null
      schedule: string | null
      maxCapacity: number
      status: BatchStatus
      visibility: string
      published: boolean
      thumbnailUrl: string | null
      bannerUrl: string | null
      completionRate: number
      instructorId: string
      course: { slug: string; title: string }
    },
    studentsCount: number,
  ) {
    return {
      id: batch.id,
      batchCode: batch.batchCode,
      name: batch.name,
      description: batch.description,
      courseId: batch.course.slug,
      courseTitle: batch.course.title,
      startDate: this.formatDate(batch.startDate),
      endDate: batch.endDate ? this.formatDate(batch.endDate) : 'TBD',
      schedule: batch.schedule ?? '',
      maxCapacity: batch.maxCapacity,
      studentsCount,
      status: batch.status,
      visibility: batch.visibility,
      published: batch.published,
      thumbnailUrl: batch.thumbnailUrl,
      bannerUrl: batch.bannerUrl,
      completionRate: Math.round(batch.completionRate),
      instructorId: batch.instructorId,
    }
  }

  async listInstructorBatches(instructorId: string, query: { courseSlug?: string; status?: string; search?: string }) {
    const orgId = await this.defaultOrgId()
    const where: Prisma.BatchWhereInput = {
      organizationId: orgId,
      OR: [{ instructorId }, { instructors: { some: { instructorId } } }],
    }
    if (query.courseSlug) where.course = { slug: query.courseSlug }
    if (query.status) where.status = query.status as BatchStatus
    if (query.search?.trim()) {
      where.AND = [
        {
          OR: [
            { name: { contains: query.search.trim(), mode: 'insensitive' } },
            { batchCode: { contains: query.search.trim(), mode: 'insensitive' } },
          ],
        },
      ]
    }

    const batches = await this.prisma.batch.findMany({
      where,
      include: { course: true, batchEnrollments: { where: { status: { not: BatchEnrollmentStatus.dropped } } } },
      orderBy: { startDate: 'desc' },
    })

    return batches.map((b) =>
      this.mapBatch(b, b.batchEnrollments.filter((e) => e.status !== BatchEnrollmentStatus.waitlist).length),
    )
  }

  async listStudentBatches(studentId: string) {
    const enrollments = await this.prisma.batchEnrollment.findMany({
      where: { studentId, status: { not: BatchEnrollmentStatus.dropped } },
      include: {
        batch: { include: { course: { include: { instructor: { include: { instructorProfile: true } } } } } },
        enrollment: true,
      },
      orderBy: { enrolledAt: 'desc' },
    })

    const results = await Promise.all(
      enrollments.map(async (be) => {
        const batchmates = await this.prisma.batchEnrollment.findMany({
          where: {
            batchId: be.batchId,
            status: BatchEnrollmentStatus.active,
            studentId: { not: studentId },
          },
          include: { student: { include: { studentProfile: true } } },
          take: 5,
        })
        const total = await this.prisma.batchEnrollment.count({
          where: { batchId: be.batchId, status: BatchEnrollmentStatus.active },
        })

        return {
          ...this.mapBatch(
            { ...be.batch, course: { slug: be.batch.course.slug, title: be.batch.course.title } },
            total,
          ),
          instructor:
            be.batch.course.instructor.instructorProfile?.displayName ?? 'Instructor',
          progress: be.enrollment?.progressPct ?? 0,
          batchEnrollmentStatus: be.status,
          batchmates: batchmates.map((m) => ({
            name: m.student.studentProfile?.displayName ?? m.student.email,
            initials: (m.student.studentProfile?.displayName ?? m.student.email)
              .split(/\s+/)
              .map((p) => p[0]?.toUpperCase() ?? '')
              .slice(0, 2)
              .join(''),
          })),
          nextSession: be.batch.schedule ?? 'See calendar',
        }
      }),
    )
    return results
  }

  async createBatch(instructorId: string, dto: CreateBatchDto) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: dto.courseSlug } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new NotFoundException('Course not found')
    }

    const batchCode = dto.batchCode?.trim() || this.generateBatchCode(dto.name)
    const publish = dto.publish ?? false

    const batch = await this.prisma.batch.create({
      data: {
        organizationId: orgId,
        courseId: course.id,
        instructorId,
        batchCode,
        name: dto.name.trim(),
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        schedule: dto.schedule,
        maxCapacity: dto.maxCapacity ?? 30,
        visibility: dto.visibility ?? 'private',
        thumbnailUrl: dto.thumbnailUrl,
        bannerUrl: dto.bannerUrl,
        status: publish ? BatchStatus.upcoming : BatchStatus.draft,
        published: publish,
        instructors: {
          create: { instructorId, role: BatchInstructorRole.lead, permissions: { manage: true } },
        },
      },
      include: { course: true, batchEnrollments: true },
    })

    return this.mapBatch(batch, 0)
  }

  async updateBatch(instructorId: string, batchId: string, dto: UpdateBatchDto) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        schedule: dto.schedule,
        maxCapacity: dto.maxCapacity,
        visibility: dto.visibility,
        thumbnailUrl: dto.thumbnailUrl,
        bannerUrl: dto.bannerUrl,
      },
      include: { course: true, batchEnrollments: true },
    })

    void this.notifyBatchStudents(batchId, batch.organizationId, (student) =>
      this.notificationMail.sendBatchUpdated({
        userId: student.id,
        email: student.email,
        name: student.name,
        batchName: batch.name,
        organizationId: batch.organizationId,
      }),
    )

    return this.mapBatch(
      batch,
      batch.batchEnrollments.filter((e) => e.status !== BatchEnrollmentStatus.waitlist).length,
    )
  }

  async deleteBatch(instructorId: string, batchId: string) {
    const batch = await this.assertInstructorBatchAccess(instructorId, batchId)
    if (batch.status === BatchStatus.active) {
      throw new BadRequestException('Archive or complete active batches before deleting')
    }
    await this.prisma.batch.delete({ where: { id: batchId } })
    return { deleted: true }
  }

  async archiveBatch(instructorId: string, batchId: string) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: { status: BatchStatus.archived, published: false },
      include: { course: true, batchEnrollments: true },
    })
    return this.mapBatch(batch, batch.batchEnrollments.length)
  }

  async publishBatch(instructorId: string, batchId: string) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: { published: true, status: BatchStatus.upcoming },
      include: { course: true, batchEnrollments: true },
    })
    return this.mapBatch(batch, batch.batchEnrollments.length)
  }

  async unpublishBatch(instructorId: string, batchId: string) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: { published: false },
      include: { course: true, batchEnrollments: true },
    })
    return this.mapBatch(batch, batch.batchEnrollments.length)
  }

  async getBatchDetail(instructorId: string, batchId: string) {
    const batch = await this.assertInstructorBatchAccess(instructorId, batchId)
    const count = await this.activeEnrollmentCount(batchId)
    const instructors = await this.prisma.batchInstructor.findMany({
      where: { batchId },
      include: { instructor: { include: { instructorProfile: true } } },
    })
    return {
      ...this.mapBatch({ ...batch, course: batch.course }, count),
      instructors: instructors.map((i) => ({
        id: i.instructorId,
        name: i.instructor.instructorProfile?.displayName ?? i.instructor.email,
        role: i.role,
        permissions: i.permissions,
      })),
    }
  }

  async getBatchDashboard(instructorId: string, batchId: string) {
    const batch = await this.assertInstructorBatchAccess(instructorId, batchId)
    const activeStudents = await this.prisma.batchEnrollment.findMany({
      where: { batchId, status: BatchEnrollmentStatus.active },
      include: { enrollment: true, student: { include: { studentProfile: true } } },
    })
    const enrollmentIds = activeStudents.map((s) => s.enrollmentId).filter(Boolean) as string[]

    const assignmentsCompleted = enrollmentIds.length
      ? await this.prisma.assignmentSubmission.count({
          where: {
            enrollmentId: { in: enrollmentIds },
            status: { in: ['submitted', 'graded', 'late'] },
          },
        })
      : 0

    const quizCompleted = enrollmentIds.length
      ? await this.prisma.quizAttempt.count({
          where: {
            enrollmentId: { in: enrollmentIds },
            status: { in: ['submitted', 'auto_graded', 'graded', 'pending_manual'] },
          },
        })
      : 0

    const certificatesIssued = enrollmentIds.length
      ? await this.prisma.certificate.count({
          where: { enrollmentId: { in: enrollmentIds }, status: 'active' },
        })
      : 0

    const avgProgress =
      activeStudents.length > 0
        ? Math.round(
            activeStudents.reduce((s, e) => s + (e.enrollment?.progressPct ?? 0), 0) /
              activeStudents.length,
          )
        : 0

    const upcomingSessions = await this.prisma.batchEvent.findMany({
      where: { batchId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 5,
    })

    return {
      studentCount: activeStudents.length,
      waitlistCount: await this.prisma.batchEnrollment.count({
        where: { batchId, status: BatchEnrollmentStatus.waitlist },
      }),
      capacityPct: batch.maxCapacity
        ? Math.round((activeStudents.length / batch.maxCapacity) * 100)
        : 0,
      avgProgress,
      assignmentsCompleted,
      quizCompleted,
      certificatesIssued,
      upcomingSessions: upcomingSessions.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startsAt: e.startsAt.toISOString(),
      })),
    }
  }

  async listBatchStudents(instructorId: string, batchId: string) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    const rows = await this.prisma.batchEnrollment.findMany({
      where: { batchId },
      include: {
        student: { include: { studentProfile: true } },
        enrollment: true,
      },
      orderBy: { enrolledAt: 'desc' },
    })
    return rows.map((r) => ({
      id: r.studentId,
      batchEnrollmentId: r.id,
      name: r.student.studentProfile?.displayName ?? r.student.email,
      email: r.student.email,
      status: r.status,
      progress: r.enrollment?.progressPct ?? 0,
      enrolledAt: formatDateLabel(r.enrolledAt),
    }))
  }

  async addStudentToBatch(instructorId: string, batchId: string, dto: AddBatchStudentDto) {
    const batch = await this.assertInstructorBatchAccess(instructorId, batchId)
    const orgId = batch.organizationId

    let studentId = dto.studentId
    if (!studentId && dto.email) {
      const email = dto.email.trim().toLowerCase()
      let user = await this.prisma.user.findUnique({ where: { email } })
      if (!user && dto.createAccount !== false) {
        user = await this.createStudentAccount(email, dto.name ?? email.split('@')[0] ?? 'Student', orgId, batch.name)
      }
      if (!user) throw new NotFoundException('Student not found')
      studentId = user.id
    }
    if (!studentId) throw new BadRequestException('studentId or email required')

    const existing = await this.prisma.batchEnrollment.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
    })
    if (existing && existing.status !== BatchEnrollmentStatus.dropped) {
      throw new ConflictException('Student already in batch')
    }

    const activeCount = await this.activeEnrollmentCount(batchId)
    let status = dto.status ?? BatchEnrollmentStatus.active
    if (status === BatchEnrollmentStatus.active && activeCount >= batch.maxCapacity) {
      status = BatchEnrollmentStatus.waitlist
    }

    let enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: batch.courseId } },
    })

    if (!enrollment && status !== BatchEnrollmentStatus.waitlist) {
      enrollment = await this.prisma.enrollment.create({
        data: {
          organizationId: orgId,
          studentId,
          courseId: batch.courseId,
          batchId,
          status: EnrollmentStatus.active,
        },
      })
    } else if (enrollment && !enrollment.batchId) {
      enrollment = await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { batchId },
      })
    }

    const batchEnrollment = await this.prisma.batchEnrollment.upsert({
      where: { batchId_studentId: { batchId, studentId } },
      create: {
        batchId,
        studentId,
        enrollmentId: enrollment?.id,
        status,
      },
      update: {
        status,
        enrollmentId: enrollment?.id,
        droppedAt: null,
      },
      include: { student: { include: { studentProfile: true } } },
    })

    const student = batchEnrollment.student
    void this.notificationMail.sendStudentAddedToBatch({
      userId: studentId,
      email: student.email,
      name: student.studentProfile?.displayName ?? student.email,
      batchName: batch.name,
      courseTitle: batch.course.title,
      waitlisted: status === BatchEnrollmentStatus.waitlist,
      organizationId: orgId,
    })

    return {
      id: studentId,
      status,
      waitlisted: status === BatchEnrollmentStatus.waitlist,
    }
  }

  private async createStudentAccount(email: string, name: string, organizationId: string, batchName: string) {
    const argon2 = await import('argon2')
    const tempPassword = randomBytes(12).toString('base64url')
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(tempPassword),
        roles: { create: { role: UserRole.student } },
        organizationMembers: { create: { organizationId, role: 'member' } },
        studentProfile: { create: { displayName: name.trim(), timezone: 'Asia/Kolkata' } },
      },
    })
    void this.notificationMail.sendStudentInvite({
      email,
      name,
      batchName,
      tempPassword,
      organizationId,
    })
    return user
  }

  async removeStudentFromBatch(instructorId: string, batchId: string, studentId: string) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    await this.prisma.batchEnrollment.updateMany({
      where: { batchId, studentId },
      data: { status: BatchEnrollmentStatus.dropped, droppedAt: new Date() },
    })
    return { removed: true }
  }

  async transferStudent(
    instructorId: string,
    batchId: string,
    studentId: string,
    dto: TransferBatchStudentDto,
  ) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    await this.assertInstructorBatchAccess(instructorId, dto.targetBatchId)

    const current = await this.prisma.batchEnrollment.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
    })
    if (!current) throw new NotFoundException('Student not in batch')

    await this.removeStudentFromBatch(instructorId, batchId, studentId)
    return this.addStudentToBatch(instructorId, dto.targetBatchId, { studentId })
  }

  async assignInstructor(instructorId: string, batchId: string, dto: AssignBatchInstructorDto) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    const record = await this.prisma.batchInstructor.upsert({
      where: { batchId_instructorId: { batchId, instructorId: dto.instructorId } },
      create: {
        batchId,
        instructorId: dto.instructorId,
        role: dto.role ?? BatchInstructorRole.assistant,
        permissions: (dto.permissions ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        role: dto.role,
        permissions: dto.permissions as Prisma.InputJsonValue,
      },
      include: { instructor: { include: { instructorProfile: true } }, batch: true },
    })

    void this.notificationMail.sendInstructorAssignedToBatch({
      userId: dto.instructorId,
      email: record.instructor.email,
      name: record.instructor.instructorProfile?.displayName ?? record.instructor.email,
      batchName: record.batch.name,
      organizationId: record.batch.organizationId,
    })

    return {
      instructorId: record.instructorId,
      role: record.role,
    }
  }

  async getBatchCalendar(instructorId: string, batchId: string) {
    await this.assertInstructorBatchAccess(instructorId, batchId)
    return this.buildCalendarData(batchId)
  }

  async getStudentBatchCalendar(studentId: string, batchId: string) {
    await this.assertStudentBatchAccess(studentId, batchId)
    return this.buildCalendarData(batchId)
  }

  private async buildCalendarData(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Batch not found')

    const events = await this.prisma.batchEvent.findMany({
      where: { batchId },
      orderBy: { startsAt: 'asc' },
    })

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId: batch.courseId, status: 'published', dueAt: { not: null } },
      select: { id: true, title: true, dueAt: true },
    })

    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId: batch.courseId, status: 'published' },
      select: { id: true, title: true, availableFrom: true, availableUntil: true },
    })

    const coaching = await this.prisma.coachingSession.findMany({
      where: {
        enrollment: { batchId },
        startsAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      select: { id: true, title: true, startsAt: true, durationMinutes: true },
    })

    return {
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt?.toISOString() ?? null,
        source: 'batch_event' as const,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueAt: a.dueAt!.toISOString(),
        type: 'deadline' as const,
      })),
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        availableFrom: q.availableFrom?.toISOString() ?? null,
        availableUntil: q.availableUntil?.toISOString() ?? null,
        type: 'quiz' as const,
      })),
      coaching: coaching.map((c) => ({
        id: c.id,
        title: c.title,
        startsAt: c.startsAt.toISOString(),
        durationMinutes: c.durationMinutes,
        type: 'coaching' as const,
      })),
    }
  }

  async createBatchEvent(instructorId: string, batchId: string, dto: CreateBatchEventDto) {
    const batch = await this.assertInstructorBatchAccess(instructorId, batchId)
    const event = await this.prisma.batchEvent.create({
      data: {
        batchId,
        organizationId: batch.organizationId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    })
    const whenLabel = event.startsAt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    void this.notifyBatchStudents(batchId, batch.organizationId, (student) =>
      this.notificationMail.sendBatchEventReminder({
        userId: student.id,
        email: student.email,
        name: student.name,
        batchName: batch.name,
        eventTitle: event.title,
        whenLabel,
        organizationId: batch.organizationId,
      }),
    )
    return event
  }

  private async notifyBatchStudents(
    batchId: string,
    organizationId: string,
    notify: (student: { id: string; email: string; name: string }) => void | Promise<void>,
  ) {
    const enrollments = await this.prisma.batchEnrollment.findMany({
      where: { batchId, status: { in: [BatchEnrollmentStatus.active, BatchEnrollmentStatus.waitlist] } },
      include: { student: { include: { studentProfile: true } } },
    })
    for (const row of enrollments) {
      void notify({
        id: row.studentId,
        email: row.student.email,
        name: row.student.studentProfile?.displayName ?? row.student.email,
      })
    }
  }
}
