import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CourseStatus, Prisma, UserRole } from '@prisma/client'
import { CreateCourseDto, InstructorCoursesQueryDto, UpdateCourseDto } from '../../common/dto/course.dto'
import { buildPaginatedMeta, paginationArgs } from '../../common/dto/pagination.dto'
import { uniqueCourseSlug } from '../../common/utils/course.util'
import { JwtPayload } from '../../common/decorators/auth.decorator'
import { PrismaService } from '../../prisma/prisma.module'
import {
  courseDetailInclude,
  mapCatalogDetail,
  mapInstructorCourse,
} from './course.mapper'
import { NotificationMailService } from '../mail/notification-mail.service'

@Injectable()
export class CoursesService {
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

  async findBySlugForViewer(slug: string, viewer?: JwtPayload) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
      include: courseDetailInclude,
    })

    if (!course) throw new NotFoundException('Course not found')

    const isOwner = viewer?.sub === course.instructorId
    const isPublishedPublic =
      course.status === CourseStatus.published && course.visibility === 'public'

    if (isPublishedPublic) {
      return { access: 'public' as const, course: mapCatalogDetail(course) }
    }

    if (isOwner && viewer?.roles.includes(UserRole.instructor)) {
      return {
        access: 'owner' as const,
        course: mapInstructorCourse(course, course.instructorId),
      }
    }

    if (viewer?.roles.includes(UserRole.student)) {
      const enrolled = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: viewer.sub, courseId: course.id } },
      })
      if (enrolled && course.status !== CourseStatus.archived) {
        return { access: 'enrolled' as const, course: mapCatalogDetail(course) }
      }
    }

    throw new NotFoundException('Course not found')
  }

  async listInstructorCourses(userId: string, query: InstructorCoursesQueryDto) {
    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)
    const where: Prisma.CourseWhereInput = { instructorId: userId }
    if (query.status) where.status = query.status

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        include: courseDetailInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
    ])

    return {
      data: rows.map((c) => mapInstructorCourse(c, userId)),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  async create(instructorId: string, dto: CreateCourseDto) {
    const orgId = await this.defaultOrgId()
    const slug = await uniqueCourseSlug(dto.title, async (candidate) => {
      const existing = await this.prisma.course.findUnique({
        where: { organizationId_slug: { organizationId: orgId, slug: candidate } },
      })
      return Boolean(existing)
    })

    let categoryId: string | undefined
    if (dto.categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } })
      if (!category) throw new BadRequestException('Invalid category')
      categoryId = category.id
    }

    const course = await this.prisma.course.create({
      data: {
        organizationId: orgId,
        instructorId,
        slug,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim(),
        description: dto.description?.trim(),
        categoryId,
        level: dto.level,
        durationHours: dto.durationHours,
        priceCents: dto.priceCents ?? 0,
        visibility: dto.visibility,
        coachingIncluded: dto.coachingIncluded ?? false,
        thumbnailUrl: dto.thumbnailUrl,
        bannerUrl: dto.bannerUrl,
        status: CourseStatus.draft,
        outcomes: dto.learningOutcomes?.length
          ? {
              create: dto.learningOutcomes.map((text, i) => ({
                text: text.trim(),
                sortOrder: i,
              })),
            }
          : undefined,
        requirements: dto.requirements?.length
          ? {
              create: dto.requirements.map((text, i) => ({
                text: text.trim(),
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: courseDetailInclude,
    })

    return mapInstructorCourse(course, instructorId)
  }

  async update(slug: string, instructorId: string, dto: UpdateCourseDto) {
    const course = await this.getOwnedCourse(slug, instructorId)

    let categoryId: string | null | undefined
    if (dto.categorySlug !== undefined) {
      if (!dto.categorySlug) {
        categoryId = null
      } else {
        const category = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } })
        if (!category) throw new BadRequestException('Invalid category')
        categoryId = category.id
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: course.id },
        data: {
          title: dto.title?.trim(),
          subtitle: dto.subtitle?.trim(),
          description: dto.description?.trim(),
          categoryId,
          level: dto.level,
          durationHours: dto.durationHours,
          priceCents: dto.priceCents,
          visibility: dto.visibility,
          coachingIncluded: dto.coachingIncluded,
          thumbnailUrl: dto.thumbnailUrl,
          bannerUrl: dto.bannerUrl,
          featured: dto.featured,
          trending: dto.trending,
          isNew: dto.isNew,
          forTeams: dto.forTeams,
        },
      })

      if (dto.learningOutcomes) {
        await tx.courseOutcome.deleteMany({ where: { courseId: course.id } })
        if (dto.learningOutcomes.length) {
          await tx.courseOutcome.createMany({
            data: dto.learningOutcomes.map((text, i) => ({
              courseId: course.id,
              text: text.trim(),
              sortOrder: i,
            })),
          })
        }
      }

      if (dto.requirements) {
        await tx.courseRequirement.deleteMany({ where: { courseId: course.id } })
        if (dto.requirements.length) {
          await tx.courseRequirement.createMany({
            data: dto.requirements.map((text, i) => ({
              courseId: course.id,
              text: text.trim(),
              sortOrder: i,
            })),
          })
        }
      }
    })

    const updated = await this.prisma.course.findUniqueOrThrow({
      where: { id: course.id },
      include: courseDetailInclude,
    })

    return mapInstructorCourse(updated, instructorId)
  }

  async delete(slug: string, instructorId: string) {
    const course = await this.getOwnedCourse(slug, instructorId)
    if (course.status !== CourseStatus.draft) {
      throw new BadRequestException('Only draft courses can be deleted. Archive published courses instead.')
    }

    const enrollmentCount = await this.prisma.enrollment.count({ where: { courseId: course.id } })
    if (enrollmentCount > 0) {
      throw new BadRequestException('Cannot delete a course with enrollments')
    }

    await this.prisma.course.delete({ where: { id: course.id } })
    return { message: 'Course deleted' }
  }

  async publish(slug: string, instructorId: string) {
    const course = await this.getOwnedCourse(slug, instructorId)
    if (!course.description?.trim()) {
      throw new BadRequestException('Add a course description before publishing')
    }

    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data: {
        status: CourseStatus.published,
        publishedAt: course.publishedAt ?? new Date(),
      },
      include: courseDetailInclude,
    })

    const instructor = updated.instructor
    const instructorName = instructor.instructorProfile?.displayName ?? instructor.email
    void this.notificationMail.sendCoursePublished({
      instructorId: instructor.id,
      email: instructor.email,
      name: instructorName,
      courseTitle: updated.title,
      courseSlug: updated.slug,
      organizationId: updated.organizationId,
    })

    return mapInstructorCourse(updated, instructorId)
  }

  async unpublish(slug: string, instructorId: string) {
    const course = await this.getOwnedCourse(slug, instructorId)
    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data: { status: CourseStatus.draft },
      include: courseDetailInclude,
    })
    return mapInstructorCourse(updated, instructorId)
  }

  async archive(slug: string, instructorId: string) {
    const course = await this.getOwnedCourse(slug, instructorId)
    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data: { status: CourseStatus.archived },
      include: courseDetailInclude,
    })
    return mapInstructorCourse(updated, instructorId)
  }

  private async getOwnedCourse(slug: string, instructorId: string) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
    })
    if (!course) throw new NotFoundException('Course not found')
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You do not own this course')
    }
    return course
  }

  getOwnedCourseRecord(slug: string, instructorId: string) {
    return this.getOwnedCourse(slug, instructorId)
  }
}
