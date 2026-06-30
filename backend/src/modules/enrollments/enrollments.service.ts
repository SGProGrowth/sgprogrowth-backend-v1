import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CourseStatus, EnrollmentStatus, UserRole } from '@prisma/client'
import { EnrollCourseDto } from '../../common/dto/course.dto'
import { buildPaginatedMeta, paginationArgs, PaginationQueryDto } from '../../common/dto/pagination.dto'
import { formatDateLabel } from '../../common/utils/course.util'
import { JwtPayload } from '../../common/decorators/auth.decorator'
import { PrismaService } from '../../prisma/prisma.module'
import { mapEnrolledCourse } from '../courses/course.mapper'
import { NotificationMailService } from '../mail/notification-mail.service'

@Injectable()
export class EnrollmentsService {
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

  async enrollStudent(studentId: string, dto: EnrollCourseDto) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: dto.courseSlug } },
    })

    if (!course || course.status !== CourseStatus.published) {
      throw new NotFoundException('Course not available for enrollment')
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
    })
    if (existing) throw new ConflictException('Already enrolled in this course')

    let batchId: string | undefined
    if (dto.batchId) {
      const batch = await this.prisma.batch.findFirst({
        where: { id: dto.batchId, courseId: course.id, status: { in: ['upcoming', 'active'] } },
      })
      if (!batch) throw new BadRequestException('Invalid or unavailable batch')
      batchId = batch.id
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        organizationId: orgId,
        studentId,
        courseId: course.id,
        batchId,
        status: EnrollmentStatus.active,
      },
      include: {
        course: { include: { category: true, instructor: { include: { instructorProfile: true } } } },
        student: { include: { studentProfile: true } },
      },
    })

    const studentName = enrollment.student.studentProfile?.displayName ?? enrollment.student.email
    void this.notificationMail.sendEnrollmentConfirmation({
      userId: studentId,
      email: enrollment.student.email,
      name: studentName,
      courseTitle: course.title,
      courseSlug: course.slug,
      organizationId: orgId,
    })

    return mapEnrolledCourse(enrollment)
  }

  async listMyEnrollments(studentId: string, query: PaginationQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)

    const where = { studentId, status: { not: EnrollmentStatus.withdrawn } }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        include: {
          course: {
            include: {
              category: true,
              instructor: { include: { instructorProfile: true } },
              modules: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take,
      }),
    ])

    return {
      data: rows.map(mapEnrolledCourse),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  async getProgress(studentId: string, courseSlug: string) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course) throw new NotFoundException('Course not found')

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
      include: {
        milestones: true,
        course: { include: { modules: { include: { lessons: true } } } },
      },
    })

    if (!enrollment) throw new NotFoundException('Not enrolled in this course')

    const totalModules = enrollment.course.modules.length
    const totalLessons = enrollment.course.modules.reduce((s, m) => s + m.lessons.length, 0)

    return {
      courseId: course.slug,
      courseTitle: course.title,
      status: enrollment.status,
      progressPct: enrollment.progressPct,
      modulesCompleted: enrollment.modulesCompleted,
      totalModules,
      totalLessons,
      hoursSpent: enrollment.hoursSpent,
      enrolledAt: formatDateLabel(enrollment.enrolledAt),
      lastAccessedAt: enrollment.lastAccessedAt
        ? formatDateLabel(enrollment.lastAccessedAt)
        : null,
      completedAt: enrollment.completedAt ? formatDateLabel(enrollment.completedAt) : null,
      milestones: enrollment.milestones.map((m) => ({
        id: m.id,
        phase: m.phase,
        title: m.title,
        description: m.description ?? '',
        status: m.status,
        completedAt: m.completedAt ? formatDateLabel(m.completedAt) : null,
      })),
    }
  }

  async listCourseEnrollments(instructorId: string, courseSlug: string, query: PaginationQueryDto) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })

    if (!course) throw new NotFoundException('Course not found')
    if (course.instructorId !== instructorId) {
      throw new NotFoundException('Course not found')
    }

    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)

    const where = { courseId: course.id }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        include: {
          student: { include: { studentProfile: true } },
          batch: true,
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take,
      }),
    ])

    return {
      data: rows.map((e) => ({
        id: e.studentId,
        enrollmentId: e.id,
        name: e.student.studentProfile?.displayName ?? e.student.email,
        email: e.student.email,
        batchName: e.batch?.name,
        enrolledDate: formatDateLabel(e.enrolledAt),
        progress: e.progressPct,
        status: e.status,
        lastAccessedAt: e.lastAccessedAt ? formatDateLabel(e.lastAccessedAt) : null,
      })),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  assertStudentRole(user: JwtPayload) {
    if (!user.roles.includes(UserRole.student)) {
      throw new BadRequestException('Student role required')
    }
  }
}
