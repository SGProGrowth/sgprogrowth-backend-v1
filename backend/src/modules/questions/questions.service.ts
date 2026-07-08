import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma, QuestionStatus, QuestionType } from '@prisma/client'
import type { Express } from 'express'
import {
  CreateQuestionCategoryDto,
  CreateQuestionDto,
  QuestionsQueryDto,
  UpdateQuestionDto,
} from '../../common/dto/question.dto'
import { buildPaginatedMeta, paginationArgs } from '../../common/dto/pagination.dto'
import { slugify } from '../../common/utils/course.util'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'
import { StorageService } from '../storage/storage.service'
import {
  buildOptionsJson,
  buildQuestionSnapshot,
  mapQuestionDetail,
  mapQuestionListItem,
  parseQuestionType,
  slugifyTag,
  type QuestionWithRelations,
} from './question.mapper'

const questionInclude = {
  optionRows: { orderBy: { sortOrder: 'asc' as const } },
  tagLinks: { include: { tag: true } },
  bankCategory: true,
  course: true,
  createdBy: { include: { instructorProfile: true } },
  updatedBy: { include: { instructorProfile: true } },
  _count: { select: { quizQuestions: true } },
} satisfies Prisma.QuestionInclude

@Injectable()
export class QuestionsService {
  private readonly apiPrefix: string

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private storage: StorageService,
    private notificationMail: NotificationMailService,
  ) {
    const prefix = this.config.get<string>('API_PREFIX') ?? 'api/v1'
    this.apiPrefix = `/${prefix}/questions`
  }

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private async getOwnedQuestion(questionId: string, instructorId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: questionInclude,
    })
    if (!question || question.instructorId !== instructorId) {
      throw new NotFoundException('Question not found')
    }
    return question
  }

  private async resolveCourse(orgId: string, courseSlug: string | undefined | null, instructorId: string) {
    if (!courseSlug) return null
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new BadRequestException('Invalid course for this instructor')
    }
    return course
  }

  private sortOrder(sort?: QuestionsQueryDto['sort']): Prisma.QuestionOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' }
      case 'marks':
        return { marks: 'desc' }
      case 'difficulty':
        return { difficulty: 'asc' }
      case 'title':
        return { title: 'asc' }
      default:
        return { updatedAt: 'desc' }
    }
  }

  async list(instructorId: string, query: QuestionsQueryDto) {
    const orgId = await this.defaultOrgId()
    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)

    const where: Prisma.QuestionWhereInput = {
      organizationId: orgId,
      instructorId,
      status: query.status ?? undefined,
    }

    if (query.q?.trim()) {
      where.OR = [
        { questionText: { contains: query.q.trim(), mode: 'insensitive' } },
        { title: { contains: query.q.trim(), mode: 'insensitive' } },
        { tags: { has: query.q.trim() } },
      ]
    }
    if (query.category) where.category = { equals: query.category, mode: 'insensitive' }
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.difficulty) where.difficulty = query.difficulty
    if (query.type) where.type = query.type
    if (query.course) where.course = { slug: query.course, organizationId: orgId }
    if (query.tag) {
      where.OR = [
        { tags: { has: query.tag } },
        { tagLinks: { some: { tag: { slug: slugifyTag(query.tag) } } } },
      ]
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        include: questionInclude,
        orderBy: this.sortOrder(query.sort),
        skip,
        take,
      }),
    ])

    return {
      data: rows.map(mapQuestionListItem),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  async create(instructorId: string, dto: CreateQuestionDto) {
    const orgId = await this.defaultOrgId()
    const course = await this.resolveCourse(orgId, dto.courseSlug, instructorId)
    const built = dto.options?.length
      ? buildOptionsJson(dto.options, dto.type)
      : { options: dto.correctAnswer ? {} : {}, correctAnswer: dto.correctAnswer ?? {} }

    const question = await this.prisma.$transaction(async (tx) => {
      const created = await tx.question.create({
        data: {
          organizationId: orgId,
          instructorId,
          createdById: instructorId,
          updatedById: instructorId,
          courseId: course?.id,
          moduleId: dto.moduleId,
          lessonId: dto.lessonId,
          categoryId: dto.categoryId,
          title: dto.title?.trim(),
          questionText: dto.questionText.trim(),
          explanation: dto.explanation?.trim(),
          type: dto.type,
          category: dto.category?.trim(),
          subject: dto.subject?.trim(),
          topic: dto.topic?.trim(),
          difficulty: dto.difficulty,
          marks: dto.marks ?? 1,
          negativeMarks: dto.negativeMarks,
          estimatedSeconds: dto.estimatedSeconds,
          codeSnippet: dto.codeSnippet,
          tags: dto.tags ?? [],
          options: built.options as Prisma.InputJsonValue,
          correctAnswer: (dto.correctAnswer ?? built.correctAnswer) as Prisma.InputJsonValue,
          status: QuestionStatus.active,
          currentVersion: 1,
        },
      })

      if (dto.options?.length) {
        await tx.questionOption.createMany({
          data: dto.options.map((o, i) => ({
            questionId: created.id,
            label: o.label,
            text: o.text.trim(),
            isCorrect: o.isCorrect ?? false,
            sortOrder: o.sortOrder ?? i,
            matchKey: o.matchKey,
            matchValue: o.matchValue,
          })),
        })
      }

      if (dto.tags?.length) await this.syncTags(tx, orgId, created.id, dto.tags)

      await tx.questionVersion.create({
        data: {
          questionId: created.id,
          versionNumber: 1,
          snapshot: buildQuestionSnapshot(created as QuestionWithRelations) as Prisma.InputJsonValue,
          changedById: instructorId,
        },
      })

      return created
    })

    const full = await this.prisma.question.findUniqueOrThrow({
      where: { id: question.id },
      include: questionInclude,
    })
    return mapQuestionDetail(full, this.apiPrefix)
  }

  async getOne(questionId: string, instructorId: string) {
    const question = await this.getOwnedQuestion(questionId, instructorId)
    return mapQuestionDetail(question, this.apiPrefix)
  }

  async preview(questionId: string, instructorId: string) {
    return this.getOne(questionId, instructorId)
  }

  async update(questionId: string, instructorId: string, dto: UpdateQuestionDto) {
    const existing = await this.getOwnedQuestion(questionId, instructorId)
    const orgId = await this.defaultOrgId()
    const course = dto.courseSlug !== undefined
      ? await this.resolveCourse(orgId, dto.courseSlug, instructorId)
      : undefined

    const nextVersion = existing.currentVersion + 1
    const type = dto.type ?? existing.type

    const built = dto.options?.length
      ? buildOptionsJson(dto.options, type)
      : null

    await this.prisma.$transaction(async (tx) => {
      if (dto.options) {
        await tx.questionOption.deleteMany({ where: { questionId: existing.id } })
        if (dto.options.length) {
          await tx.questionOption.createMany({
            data: dto.options.map((o, i) => ({
              questionId: existing.id,
              label: o.label,
              text: o.text.trim(),
              isCorrect: o.isCorrect ?? false,
              sortOrder: o.sortOrder ?? i,
              matchKey: o.matchKey,
              matchValue: o.matchValue,
            })),
          })
        }
      }

      if (dto.tags) await this.syncTags(tx, orgId, existing.id, dto.tags)

      await tx.question.update({
        where: { id: existing.id },
        data: {
          updatedById: instructorId,
          currentVersion: nextVersion,
          title: dto.title?.trim(),
          questionText: dto.questionText?.trim(),
          explanation: dto.explanation?.trim(),
          type: dto.type,
          difficulty: dto.difficulty,
          marks: dto.marks,
          negativeMarks: dto.negativeMarks,
          estimatedSeconds: dto.estimatedSeconds,
          category: dto.category?.trim(),
          categoryId: dto.categoryId,
          subject: dto.subject?.trim(),
          topic: dto.topic?.trim(),
          courseId: dto.courseSlug !== undefined ? course?.id ?? null : undefined,
          moduleId: dto.moduleId,
          lessonId: dto.lessonId,
          codeSnippet: dto.codeSnippet,
          tags: dto.tags,
          options: built ? (built.options as Prisma.InputJsonValue) : undefined,
          correctAnswer: dto.correctAnswer
            ? (dto.correctAnswer as Prisma.InputJsonValue)
            : built
              ? (built.correctAnswer as Prisma.InputJsonValue)
              : undefined,
        },
      })
    })

    const updated = await this.getOwnedQuestion(questionId, instructorId)
    await this.prisma.questionVersion.create({
      data: {
        questionId: existing.id,
        versionNumber: nextVersion,
        snapshot: buildQuestionSnapshot(updated) as Prisma.InputJsonValue,
        changedById: instructorId,
      },
    })

    return mapQuestionDetail(updated, this.apiPrefix)
  }

  async delete(questionId: string, instructorId: string) {
    const question = await this.getOwnedQuestion(questionId, instructorId)
    const used = await this.prisma.quizQuestion.count({ where: { questionId } })
    if (used > 0) {
      throw new BadRequestException(
        'Question is referenced by quizzes. Archive it instead of deleting.',
      )
    }
    await this.prisma.question.delete({ where: { id: question.id } })
    return { message: 'Question deleted' }
  }

  async archive(questionId: string, instructorId: string) {
    await this.getOwnedQuestion(questionId, instructorId)
    await this.prisma.question.update({
      where: { id: questionId },
      data: { status: QuestionStatus.archived, updatedById: instructorId },
    })
    return { message: 'Question archived' }
  }

  async restore(questionId: string, instructorId: string) {
    await this.getOwnedQuestion(questionId, instructorId)
    await this.prisma.question.update({
      where: { id: questionId },
      data: { status: QuestionStatus.active, updatedById: instructorId },
    })
    return { message: 'Question restored' }
  }

  async duplicate(questionId: string, instructorId: string) {
    const source = await this.getOwnedQuestion(questionId, instructorId)
    const copy = await this.create(instructorId, {
      title: source.title ? `${source.title} (Copy)` : undefined,
      questionText: source.questionText,
      type: source.type,
      explanation: source.explanation ?? undefined,
      difficulty: source.difficulty,
      marks: source.marks,
      negativeMarks: source.negativeMarks ?? undefined,
      estimatedSeconds: source.estimatedSeconds ?? undefined,
      category: source.category ?? undefined,
      categoryId: source.categoryId ?? undefined,
      subject: source.subject ?? undefined,
      topic: source.topic ?? undefined,
      tags: source.tags,
      codeSnippet: source.codeSnippet ?? undefined,
      options: source.optionRows.map((o) => ({
        label: o.label ?? undefined,
        text: o.text,
        isCorrect: o.isCorrect,
        sortOrder: o.sortOrder,
        matchKey: o.matchKey ?? undefined,
        matchValue: o.matchValue ?? undefined,
      })),
      correctAnswer: source.correctAnswer as Record<string, unknown>,
    })
    return copy
  }

  async listVersions(questionId: string, instructorId: string) {
    await this.getOwnedQuestion(questionId, instructorId)
    const versions = await this.prisma.questionVersion.findMany({
      where: { questionId },
      include: { changedBy: { include: { instructorProfile: true } } },
      orderBy: { versionNumber: 'desc' },
    })
    return versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      changedBy: v.changedBy.instructorProfile?.displayName ?? v.changedBy.email,
      createdAt: v.createdAt.toISOString(),
    }))
  }

  async getVersion(questionId: string, version: number, instructorId: string) {
    await this.getOwnedQuestion(questionId, instructorId)
    const record = await this.prisma.questionVersion.findUnique({
      where: { questionId_versionNumber: { questionId, versionNumber: version } },
    })
    if (!record) throw new NotFoundException('Version not found')
    return { versionNumber: record.versionNumber, snapshot: record.snapshot, createdAt: record.createdAt }
  }

  async listCategories(instructorId: string) {
    const orgId = await this.defaultOrgId()
    const rows = await this.prisma.questionCategory.findMany({
      where: {
        organizationId: orgId,
        OR: [{ instructorId: null }, { instructorId }],
      },
      orderBy: { name: 'asc' },
    })
    return rows
  }

  async createCategory(instructorId: string, dto: CreateQuestionCategoryDto) {
    const orgId = await this.defaultOrgId()
    const baseSlug = slugify(dto.name)
    let candidate = baseSlug
    let n = 2
    while (
      await this.prisma.questionCategory.findUnique({
        where: { organizationId_slug: { organizationId: orgId, slug: candidate } },
      })
    ) {
      candidate = `${baseSlug}-${n++}`
    }

    return this.prisma.questionCategory.create({
      data: {
        organizationId: orgId,
        instructorId,
        name: dto.name.trim(),
        slug: candidate,
        subject: dto.subject?.trim(),
        parentId: dto.parentId,
      },
    })
  }

  async listTags() {
    const orgId = await this.defaultOrgId()
    return this.prisma.questionTag.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
      take: 200,
    })
  }

  async addAttachment(questionId: string, instructorId: string, file: Express.Multer.File, kind = 'file') {
    await this.getOwnedQuestion(questionId, instructorId)
    const storageKey = this.storage.buildKey(`questions/${questionId}`, file.originalname)
    await this.storage.saveBuffer(storageKey, file.buffer)
    return this.prisma.questionAttachment.create({
      data: {
        questionId,
        storageKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        kind,
      },
    })
  }

  private async syncTags(
    tx: Prisma.TransactionClient,
    orgId: string,
    questionId: string,
    tags: string[],
  ) {
    await tx.questionTagLink.deleteMany({ where: { questionId } })
    for (const raw of tags) {
      const name = raw.trim()
      if (!name) continue
      const slug = slugifyTag(name)
      const tag = await tx.questionTag.upsert({
        where: { organizationId_slug: { organizationId: orgId, slug } },
        create: { organizationId: orgId, name, slug },
        update: {},
      })
      await tx.questionTagLink.create({ data: { questionId, tagId: tag.id } })
    }
  }

  /** Used by import service */
  async createFromImport(instructorId: string, row: CreateQuestionDto) {
    return this.create(instructorId, row)
  }

  /** Used by export service */
  async exportRows(instructorId: string, query: QuestionsQueryDto) {
    const result = await this.list(instructorId, { ...query, page: 1, pageSize: 1000 })
    return result.data
  }

  parseType(value: string): QuestionType {
    return parseQuestionType(value)
  }

  async notifyImportComplete(instructorId: string, email: string, name: string, imported: number, failed: number) {
    void this.notificationMail.sendSystemAnnouncement({
      userId: instructorId,
      email,
      name,
      title: 'Question import complete',
      message: `${imported} question(s) imported successfully${failed ? `, ${failed} failed` : ''}.`,
      actionUrl: '/instructor/question-bank',
    })
  }
}
