import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  AssignmentStatus,
  AssignmentVisibility,
  Prisma,
  SubmissionStatus,
} from '@prisma/client'
import type { Express } from 'express'
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  InstructorAssignmentsQueryDto,
  ReturnSubmissionDto,
  SubmissionsQueryDto,
  UpdateAssignmentDto,
} from '../../common/dto/assignment.dto'
import { buildPaginatedMeta, paginationArgs } from '../../common/dto/pagination.dto'
import { formatDateLabel } from '../../common/utils/course.util'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'
import { ProgressService } from '../progress/progress.service'
import { StorageService } from '../storage/storage.service'
import {
  extensionFromMime,
  isVisibleToStudent,
  mapAssignmentDetail,
  mapGradeHistory,
  mapInstructorAssignmentListItem,
  mapInstructorSubmission,
  mapStudentAssignmentListItem,
  mapSubmission,
} from './assignment.mapper'

const assignmentInclude = {
  course: true,
  attachments: true,
  module: true,
  lesson: true,
} satisfies Prisma.AssignmentInclude

const submissionInclude = {
  files: { orderBy: { uploadedAt: 'desc' as const } },
  enrollment: {
    include: {
      student: { include: { studentProfile: true } },
    },
  },
  grades: {
    orderBy: { gradedAt: 'desc' as const },
    include: {
      grader: { include: { instructorProfile: true } },
    },
  },
} satisfies Prisma.AssignmentSubmissionInclude

@Injectable()
export class AssignmentsService {
  private readonly apiPrefix: string

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private storage: StorageService,
    private notificationMail: NotificationMailService,
    private progressService: ProgressService,
  ) {
    const prefix = this.config.get<string>('API_PREFIX') ?? 'api/v1'
    this.apiPrefix = `/${prefix}/assignments`
  }

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private async getOwnedAssignment(assignmentId: string, instructorId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: assignmentInclude,
    })
    if (!assignment || assignment.instructorId !== instructorId) {
      throw new NotFoundException('Assignment not found')
    }
    return assignment
  }

  private async resolveCourseForInstructor(courseSlug: string, instructorId: string) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new BadRequestException('Invalid course for this instructor')
    }
    return course
  }

  private async validateCurriculumLinks(
    courseId: string,
    moduleId?: string | null,
    lessonId?: string | null,
  ) {
    if (lessonId) {
      const lesson = await this.prisma.courseLesson.findFirst({
        where: { id: lessonId, module: { courseId } },
      })
      if (!lesson) throw new BadRequestException('Invalid lesson for this course')
      if (moduleId && lesson.moduleId !== moduleId) {
        throw new BadRequestException('Lesson does not belong to the specified module')
      }
      return { moduleId: lesson.moduleId, lessonId: lesson.id }
    }

    if (moduleId) {
      const module = await this.prisma.courseModule.findFirst({
        where: { id: moduleId, courseId },
      })
      if (!module) throw new BadRequestException('Invalid module for this course')
    }

    return { moduleId: moduleId ?? null, lessonId: lessonId ?? null }
  }

  private validateUploadFiles(
    files: Express.Multer.File[],
    allowedFileTypes: string[],
    maxFileSizeBytes: number,
  ) {
    if (!files.length) return

    for (const file of files) {
      if (file.size > maxFileSizeBytes) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds maximum size of ${Math.round(maxFileSizeBytes / 1024 / 1024)}MB`,
        )
      }

      if (allowedFileTypes.length) {
        const ext = file.originalname.split('.').pop()?.toLowerCase() ?? ''
        const mimeExt = extensionFromMime(file.mimetype)
        const allowed = allowedFileTypes.map((t) => t.toLowerCase().replace(/^\./, ''))
        if (!allowed.includes(ext) && !allowed.includes(mimeExt)) {
          throw new BadRequestException(
            `File type not allowed for "${file.originalname}". Allowed: ${allowed.join(', ')}`,
          )
        }
      }
    }
  }

  private async getStudentEnrollment(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course')
    return enrollment
  }

  private async countCourseStudents(courseId: string) {
    return this.prisma.enrollment.count({ where: { courseId, status: 'active' } })
  }

  // ── Instructor: list & CRUD ───────────────────────────────────────────────

  async listInstructorAssignments(instructorId: string, query: InstructorAssignmentsQueryDto) {
    const orgId = await this.defaultOrgId()
    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)

    const where: Prisma.AssignmentWhereInput = {
      organizationId: orgId,
      instructorId,
    }

    if (query.status) where.status = query.status
    if (query.course) {
      where.course = { slug: query.course, organizationId: orgId }
    }
    if (query.q?.trim()) {
      where.OR = [
        { title: { contains: query.q.trim(), mode: 'insensitive' } },
        { course: { title: { contains: query.q.trim(), mode: 'insensitive' } } },
      ]
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.assignment.count({ where }),
      this.prisma.assignment.findMany({
        where,
        include: {
          course: true,
          _count: {
            select: {
              submissions: {
                where: { status: { in: ['submitted', 'graded', 'late'] } },
              },
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      }),
    ])

    const data = await Promise.all(
      rows.map(async (row) => {
        const totalStudents = await this.countCourseStudents(row.courseId)
        return mapInstructorAssignmentListItem(row, {
          submissions: row._count.submissions,
          totalStudents,
        })
      }),
    )

    return { data, meta: buildPaginatedMeta(total, page, pageSize) }
  }

  async createAssignment(instructorId: string, dto: CreateAssignmentDto) {
    const orgId = await this.defaultOrgId()
    const course = await this.resolveCourseForInstructor(dto.courseSlug, instructorId)
    const links = await this.validateCurriculumLinks(course.id, dto.moduleId, dto.lessonId)

    const assignment = await this.prisma.assignment.create({
      data: {
        organizationId: orgId,
        instructorId,
        courseId: course.id,
        moduleId: links.moduleId,
        lessonId: links.lessonId,
        title: dto.title.trim(),
        type: dto.type?.trim() ?? 'project',
        instructions: dto.instructions?.trim(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        maxScore: dto.maxScore ?? 100,
        allowLate: dto.allowLate ?? false,
        latePenaltyPct: dto.latePenaltyPct,
        allowResubmission: dto.allowResubmission ?? false,
        allowedFileTypes: dto.allowedFileTypes ?? [],
        maxFileSizeBytes: dto.maxFileSizeBytes ?? 10_485_760,
        visibility: dto.visibility ?? AssignmentVisibility.enrolled,
        status: AssignmentStatus.draft,
      },
      include: assignmentInclude,
    })

    return mapAssignmentDetail(assignment, this.apiPrefix)
  }

  async getAssignmentForInstructor(assignmentId: string, instructorId: string) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    return mapAssignmentDetail(assignment, this.apiPrefix)
  }

  async updateAssignment(assignmentId: string, instructorId: string, dto: UpdateAssignmentDto) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)

    if (dto.moduleId !== undefined || dto.lessonId !== undefined) {
      await this.validateCurriculumLinks(
        assignment.courseId,
        dto.moduleId ?? undefined,
        dto.lessonId ?? undefined,
      )
    }

    const updated = await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        title: dto.title?.trim(),
        moduleId: dto.moduleId,
        lessonId: dto.lessonId,
        type: dto.type?.trim(),
        instructions: dto.instructions?.trim(),
        dueAt: dto.dueAt === null ? null : dto.dueAt ? new Date(dto.dueAt) : undefined,
        maxScore: dto.maxScore,
        allowLate: dto.allowLate,
        latePenaltyPct: dto.latePenaltyPct,
        allowResubmission: dto.allowResubmission,
        allowedFileTypes: dto.allowedFileTypes,
        maxFileSizeBytes: dto.maxFileSizeBytes,
        visibility: dto.visibility,
      },
      include: assignmentInclude,
    })

    return mapAssignmentDetail(updated, this.apiPrefix)
  }

  async deleteAssignment(assignmentId: string, instructorId: string) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    if (assignment.status !== AssignmentStatus.draft) {
      throw new BadRequestException('Only draft assignments can be deleted')
    }

    for (const attachment of assignment.attachments ?? []) {
      await this.storage.deleteObject(attachment.storageKey)
    }

    await this.prisma.assignment.delete({ where: { id: assignment.id } })
    return { message: 'Assignment deleted' }
  }

  async publishAssignment(assignmentId: string, instructorId: string) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    if (assignment.status === AssignmentStatus.published) {
      return mapAssignmentDetail(assignment, this.apiPrefix)
    }

    const updated = await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        status: AssignmentStatus.published,
        publishedAt: new Date(),
        visibility:
          assignment.visibility === AssignmentVisibility.hidden
            ? AssignmentVisibility.enrolled
            : assignment.visibility,
      },
      include: assignmentInclude,
    })

    void this.notifyStudentsPublished(updated)
    return mapAssignmentDetail(updated, this.apiPrefix)
  }

  async unpublishAssignment(assignmentId: string, instructorId: string) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    const updated = await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: AssignmentStatus.draft },
      include: assignmentInclude,
    })
    return mapAssignmentDetail(updated, this.apiPrefix)
  }

  private async notifyStudentsPublished(
    assignment: Prisma.AssignmentGetPayload<{ include: typeof assignmentInclude }>,
  ) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: assignment.courseId, status: 'active' },
      include: { student: { include: { studentProfile: true } } },
    })

    const dueLabel = assignment.dueAt ? formatDateLabel(assignment.dueAt) : 'soon'

    for (const enrollment of enrollments) {
      void this.notificationMail.sendAssignmentPublished({
        userId: enrollment.studentId,
        email: enrollment.student.email,
        name: enrollment.student.studentProfile?.displayName ?? enrollment.student.email,
        assignmentTitle: assignment.title,
        courseTitle: assignment.course.title,
        dueLabel,
        organizationId: assignment.organizationId,
      })
    }
  }

  async addAssignmentAttachment(
    assignmentId: string,
    instructorId: string,
    file: Express.Multer.File,
  ) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    this.validateUploadFiles([file], assignment.allowedFileTypes, assignment.maxFileSizeBytes)

    const storageKey = this.storage.buildKey(`assignments/${assignment.id}`, file.originalname)
    await this.storage.saveBuffer(storageKey, file.buffer)

    const attachment = await this.prisma.assignmentAttachment.create({
      data: {
        assignmentId: assignment.id,
        storageKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    })

    return {
      ...attachment,
      downloadUrl: `${this.apiPrefix}/${assignment.id}/attachments/${attachment.id}/download`,
    }
  }

  async deleteAssignmentAttachment(
    assignmentId: string,
    attachmentId: string,
    instructorId: string,
  ) {
    await this.getOwnedAssignment(assignmentId, instructorId)
    const attachment = await this.prisma.assignmentAttachment.findFirst({
      where: { id: attachmentId, assignmentId },
    })
    if (!attachment) throw new NotFoundException('Attachment not found')

    await this.storage.deleteObject(attachment.storageKey)
    await this.prisma.assignmentAttachment.delete({ where: { id: attachment.id } })
    return { message: 'Attachment removed' }
  }

  async downloadAssignmentAttachment(
    assignmentId: string,
    attachmentId: string,
    userId: string,
    role: 'student' | 'instructor',
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })
    if (!assignment) throw new NotFoundException('Assignment not found')

    if (role === 'instructor') {
      if (assignment.instructorId !== userId) throw new NotFoundException('Assignment not found')
    } else {
      if (!isVisibleToStudent(assignment)) throw new NotFoundException('Assignment not found')
      await this.getStudentEnrollment(userId, assignment.courseId)
    }

    const attachment = await this.prisma.assignmentAttachment.findFirst({
      where: { id: attachmentId, assignmentId },
    })
    if (!attachment) throw new NotFoundException('Attachment not found')

    return {
      stream: await this.storage.openReadStream(attachment.storageKey),
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    }
  }

  // ── Instructor: submissions & grading ─────────────────────────────────────

  async listSubmissions(
    assignmentId: string,
    instructorId: string,
    query: SubmissionsQueryDto,
  ) {
    await this.getOwnedAssignment(assignmentId, instructorId)
    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)

    const where: Prisma.AssignmentSubmissionWhereInput = { assignmentId }
    if (query.status) where.status = query.status
    if (query.q?.trim()) {
      where.enrollment = {
        student: {
          OR: [
            { email: { contains: query.q.trim(), mode: 'insensitive' } },
            {
              studentProfile: {
                displayName: { contains: query.q.trim(), mode: 'insensitive' },
              },
            },
          ],
        },
      }
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.assignmentSubmission.count({ where }),
      this.prisma.assignmentSubmission.findMany({
        where,
        include: submissionInclude,
        orderBy: [{ submittedAt: 'desc' }],
        skip,
        take,
      }),
    ])

    return {
      data: rows.map((row) => mapInstructorSubmission(row, this.apiPrefix, assignmentId)),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  async getSubmission(assignmentId: string, submissionId: string, instructorId: string) {
    await this.getOwnedAssignment(assignmentId, instructorId)
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignmentId },
      include: submissionInclude,
    })
    if (!submission) throw new NotFoundException('Submission not found')
    return mapInstructorSubmission(submission, this.apiPrefix, assignmentId)
  }

  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    instructorId: string,
    dto: GradeSubmissionDto,
  ) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignmentId },
      include: submissionInclude,
    })
    if (!submission) throw new NotFoundException('Submission not found')

    if (dto.score > assignment.maxScore) {
      throw new BadRequestException(`Score cannot exceed maximum of ${assignment.maxScore}`)
    }

    if (dto.returnToStudent) {
      return this.returnSubmission(assignmentId, submissionId, instructorId, {
        feedback: dto.feedback,
      })
    }

    const graded = await this.prisma.$transaction(async (tx) => {
      await tx.assignmentGrade.create({
        data: {
          submissionId: submission.id,
          graderId: instructorId,
          score: dto.score,
          maxScore: assignment.maxScore,
          feedback: dto.feedback?.trim(),
          returned: false,
        },
      })

      return tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.graded,
          score: dto.score,
          feedback: dto.feedback?.trim(),
          gradedBy: instructorId,
          gradedAt: new Date(),
          returnedAt: null,
        },
        include: submissionInclude,
      })
    })

    void this.notifyStudentGraded(assignment, graded)
    return mapInstructorSubmission(graded, this.apiPrefix, assignmentId)
  }

  async returnSubmission(
    assignmentId: string,
    submissionId: string,
    instructorId: string,
    dto: ReturnSubmissionDto,
  ) {
    const assignment = await this.getOwnedAssignment(assignmentId, instructorId)
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignmentId },
      include: submissionInclude,
    })
    if (!submission) throw new NotFoundException('Submission not found')

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.assignmentGrade.create({
        data: {
          submissionId: submission.id,
          graderId: instructorId,
          score: submission.score ?? 0,
          maxScore: assignment.maxScore,
          feedback: dto.feedback?.trim(),
          returned: true,
        },
      })

      return tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.returned,
          feedback: dto.feedback?.trim(),
          returnedAt: new Date(),
          gradedAt: null,
          score: null,
        },
        include: submissionInclude,
      })
    })

    void this.notifyStudentReturned(assignment, updated)
    return mapInstructorSubmission(updated, this.apiPrefix, assignmentId)
  }

  async getSubmissionGradeHistory(
    assignmentId: string,
    submissionId: string,
    instructorId: string,
  ) {
    await this.getOwnedAssignment(assignmentId, instructorId)
    const grades = await this.prisma.assignmentGrade.findMany({
      where: { submission: { id: submissionId, assignmentId } },
      include: { grader: { include: { instructorProfile: true } } },
      orderBy: { gradedAt: 'desc' },
    })
    return grades.map(mapGradeHistory)
  }

  async downloadSubmissionFile(
    assignmentId: string,
    submissionId: string,
    fileId: string,
    userId: string,
    role: 'student' | 'instructor',
  ) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) throw new NotFoundException('Assignment not found')

    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignmentId },
      include: { enrollment: true },
    })
    if (!submission) throw new NotFoundException('Submission not found')

    if (role === 'instructor') {
      if (assignment.instructorId !== userId) throw new NotFoundException('Submission not found')
    } else if (submission.enrollment.studentId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    const file = await this.prisma.submissionAttachment.findFirst({
      where: { id: fileId, submissionId },
    })
    if (!file) throw new NotFoundException('File not found')

    return {
      stream: await this.storage.openReadStream(file.storageKey),
      filename: file.filename,
      mimeType: file.mimeType,
    }
  }

  private async notifyStudentGraded(
    assignment: Prisma.AssignmentGetPayload<{ include: typeof assignmentInclude }>,
    submission: Prisma.AssignmentSubmissionGetPayload<{ include: typeof submissionInclude }>,
  ) {
    const student = submission.enrollment?.student
    if (!student) return

    void this.notificationMail.sendAssignmentGraded({
      userId: student.id,
      email: student.email,
      name: student.studentProfile?.displayName ?? student.email,
      assignmentTitle: assignment.title,
      courseTitle: assignment.course.title,
      score: submission.score ?? 0,
      maxScore: assignment.maxScore,
      organizationId: assignment.organizationId,
    })
  }

  private async notifyStudentReturned(
    assignment: Prisma.AssignmentGetPayload<{ include: typeof assignmentInclude }>,
    submission: Prisma.AssignmentSubmissionGetPayload<{ include: typeof submissionInclude }>,
  ) {
    const student = submission.enrollment?.student
    if (!student) return

    void this.notificationMail.sendAssignmentReturned({
      userId: student.id,
      email: student.email,
      name: student.studentProfile?.displayName ?? student.email,
      assignmentTitle: assignment.title,
      courseTitle: assignment.course.title,
      organizationId: assignment.organizationId,
    })
  }

  // ── Student ───────────────────────────────────────────────────────────────

  async listStudentAssignments(studentId: string, query: InstructorAssignmentsQueryDto) {
    const orgId = await this.defaultOrgId()
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, organizationId: orgId, status: 'active' },
      select: { courseId: true },
    })
    const courseIds = enrollments.map((e) => e.courseId)
    if (!courseIds.length) {
      return { data: [], meta: buildPaginatedMeta(0, 1, query.pageSize ?? 20) }
    }

    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)
    const where: Prisma.AssignmentWhereInput = {
      courseId: { in: courseIds },
      status: AssignmentStatus.published,
      visibility: AssignmentVisibility.enrolled,
    }

    if (query.course) {
      where.course = { slug: query.course, organizationId: orgId }
    }
    if (query.q?.trim()) {
      where.title = { contains: query.q.trim(), mode: 'insensitive' }
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.assignment.count({ where }),
      this.prisma.assignment.findMany({
        where,
        include: {
          course: true,
          submissions: {
            where: { enrollment: { studentId } },
          },
        },
        orderBy: [{ dueAt: 'asc' }, { title: 'asc' }],
        skip,
        take,
      }),
    ])

    return {
      data: rows.map((row) => mapStudentAssignmentListItem(row, row.submissions[0])),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  async getAssignmentForStudent(assignmentId: string, studentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        ...assignmentInclude,
        submissions: { where: { enrollment: { studentId } }, include: submissionInclude },
      },
    })
    if (!assignment || !isVisibleToStudent(assignment)) {
      throw new NotFoundException('Assignment not found')
    }

    await this.getStudentEnrollment(studentId, assignment.courseId)
    const detail = mapAssignmentDetail(assignment, this.apiPrefix)
    const submission = assignment.submissions[0]
      ? mapSubmission(assignment.submissions[0], this.apiPrefix, assignment.id)
      : null

    return {
      ...detail,
      submissionStatus: mapStudentAssignmentListItem(assignment, assignment.submissions[0])
        .submissionStatus,
      submission,
    }
  }

  async getMySubmission(assignmentId: string, studentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment || !isVisibleToStudent(assignment)) {
      throw new NotFoundException('Assignment not found')
    }

    const enrollment = await this.getStudentEnrollment(studentId, assignment.courseId)
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_enrollmentId: {
          assignmentId,
          enrollmentId: enrollment.id,
        },
      },
      include: submissionInclude,
    })

    if (!submission) {
      return {
        submission: null,
        gradeHistory: [],
      }
    }

    return {
      submission: mapSubmission(submission, this.apiPrefix, assignmentId),
      gradeHistory: submission.grades.map(mapGradeHistory),
    }
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    body: string | undefined,
    files: Express.Multer.File[],
    replace: boolean,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true, instructor: { include: { instructorProfile: true } } },
    })
    if (!assignment || !isVisibleToStudent(assignment)) {
      throw new NotFoundException('Assignment not found')
    }

    const enrollment = await this.getStudentEnrollment(studentId, assignment.courseId)
    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_enrollmentId: { assignmentId, enrollmentId: enrollment.id },
      },
      include: { files: true },
    })

    if (existing) {
      const canResubmit =
        assignment.allowResubmission ||
        existing.status === SubmissionStatus.returned ||
        existing.status === SubmissionStatus.pending

      if (!canResubmit && !replace) {
        throw new BadRequestException('Resubmission is not allowed for this assignment')
      }

      if (
        existing.status === SubmissionStatus.graded &&
        !assignment.allowResubmission
      ) {
        throw new BadRequestException('This assignment has already been graded')
      }
    }

    this.validateUploadFiles(files, assignment.allowedFileTypes, assignment.maxFileSizeBytes)
    if (!body?.trim() && !files.length && !existing) {
      throw new BadRequestException('Submission must include text or at least one file')
    }

    const now = new Date()
    const isLate = assignment.dueAt ? now > assignment.dueAt : false
    if (isLate && !assignment.allowLate) {
      throw new BadRequestException('Late submissions are not allowed for this assignment')
    }

    const attemptNumber = (existing?.attemptCount ?? 0) + 1

    const submission = await this.prisma.$transaction(async (tx) => {
      if (existing?.files.length) {
        await tx.submissionAttachment.updateMany({
          where: { submissionId: existing.id, isActive: true },
          data: { isActive: false },
        })
      }

      const record = existing
        ? await tx.assignmentSubmission.update({
            where: { id: existing.id },
            data: {
              body: body?.trim() ?? existing.body,
              status: isLate ? SubmissionStatus.late : SubmissionStatus.submitted,
              submittedAt: now,
              attemptCount: attemptNumber,
              score: null,
              feedback: null,
              gradedAt: null,
              returnedAt: null,
            },
          })
        : await tx.assignmentSubmission.create({
            data: {
              assignmentId,
              enrollmentId: enrollment.id,
              body: body?.trim(),
              status: isLate ? SubmissionStatus.late : SubmissionStatus.submitted,
              submittedAt: now,
              attemptCount: 1,
            },
          })

      for (const file of files) {
        const storageKey = this.storage.buildKey(
          `submissions/${record.id}`,
          file.originalname,
        )
        await this.storage.saveBuffer(storageKey, file.buffer)
        await tx.submissionAttachment.create({
          data: {
            submissionId: record.id,
            storageKey,
            filename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            attemptNumber,
            isActive: true,
          },
        })
      }

      return tx.assignmentSubmission.findUniqueOrThrow({
        where: { id: record.id },
        include: submissionInclude,
      })
    })

    void this.notificationMail.sendAssignmentSubmitted({
      instructorId: assignment.instructorId,
      email: assignment.instructor.email,
      name: assignment.instructor.instructorProfile?.displayName ?? assignment.instructor.email,
      studentName:
        submission.enrollment?.student.studentProfile?.displayName ??
        submission.enrollment?.student.email ??
        'A student',
      assignmentTitle: assignment.title,
      courseTitle: assignment.course.title,
      organizationId: assignment.organizationId,
    })

    void this.progressService.onAssignmentSubmitted(enrollment.id, assignmentId)

    return mapSubmission(submission, this.apiPrefix, assignmentId)
  }

  async downloadMySubmissionFile(
    assignmentId: string,
    fileId: string,
    studentId: string,
  ) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment || !isVisibleToStudent(assignment)) {
      throw new NotFoundException('Assignment not found')
    }

    const enrollment = await this.getStudentEnrollment(studentId, assignment.courseId)
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_enrollmentId: { assignmentId, enrollmentId: enrollment.id },
      },
    })
    if (!submission) throw new NotFoundException('Submission not found')

    const file = await this.prisma.submissionAttachment.findFirst({
      where: { id: fileId, submissionId: submission.id },
    })
    if (!file) throw new NotFoundException('File not found')

    return {
      stream: await this.storage.openReadStream(file.storageKey),
      filename: file.filename,
      mimeType: file.mimeType,
    }
  }
}
