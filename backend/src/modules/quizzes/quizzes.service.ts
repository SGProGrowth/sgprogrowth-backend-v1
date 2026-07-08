import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Prisma,
  QuizAttemptStatus,
  QuizAnswerGradingStatus,
  QuizStatus,
  QuizVisibility,
} from '@prisma/client'
import {
  CreateQuizDto,
  GenerateQuizQuestionsDto,
  GradeQuizAnswerDto,
  InstructorQuizzesQueryDto,
  SaveQuizAnswersDto,
  SetQuizQuestionsDto,
  UpdateQuizDto,
} from '../../common/dto/quiz.dto'
import { buildPaginatedMeta, paginationArgs } from '../../common/dto/pagination.dto'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'
import { ProgressService } from '../progress/progress.service'
import { gradeResponse, isManualGradingPending } from './quiz-grader'
import {
  AttemptWithAnswers,
  QuizWithRelations,
  buildQuestionWhere,
  computeTotalMarks,
  isQuizAvailable,
  mapAttemptResult,
  mapInstructorQuizListItem,
  mapPlayerQuestion,
  mapQuizDetail,
  mapStudentQuizListItem,
  shuffleQuestions,
} from './quiz.mapper'

const quizInclude = {
  course: true,
  questions: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      question: { include: { optionRows: { orderBy: { sortOrder: 'asc' as const } } } },
    },
  },
  _count: { select: { questions: true, attempts: true } },
} satisfies Prisma.QuizInclude

const attemptInclude = {
  answerRows: {
    include: {
      quizQuestion: {
        include: {
          question: { include: { optionRows: true } },
        },
      },
    },
  },
  result: true,
} satisfies Prisma.QuizAttemptInclude

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notificationMail: NotificationMailService,
    private progressService: ProgressService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private async getOwnedQuiz(quizId: string, instructorId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: quizInclude,
    })
    if (!quiz || quiz.instructorId !== instructorId) {
      throw new NotFoundException('Quiz not found')
    }
    return quiz
  }

  private async resolveCourse(orgId: string, courseSlug: string | undefined, instructorId: string) {
    if (!courseSlug) return null
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new BadRequestException('Invalid course for this instructor')
    }
    return course
  }

  private async recalcTotalMarks(quizId: string) {
    const links = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      include: { question: true },
    })
    const total = computeTotalMarks(links)
    await this.prisma.quiz.update({ where: { id: quizId }, data: { totalMarks: total } })
    return total
  }

  private async getStudentEnrollment(studentId: string, courseId: string | null | undefined) {
    if (!courseId) return null
    return this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
  }

  async listInstructorQuizzes(instructorId: string, query: InstructorQuizzesQueryDto) {
    const orgId = await this.defaultOrgId()
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const { skip, take } = paginationArgs(page, pageSize)
    const where: Prisma.QuizWhereInput = {
      organizationId: orgId,
      instructorId,
    }
    if (query.status) where.status = query.status
    if (query.generic === true) where.isGeneric = true
    if (query.generic === false) where.isGeneric = false
    if (query.course) {
      where.course = { slug: query.course }
    }
    if (query.q?.trim()) {
      where.OR = [
        { title: { contains: query.q.trim(), mode: 'insensitive' } },
        { description: { contains: query.q.trim(), mode: 'insensitive' } },
      ]
    }

    const [rows, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: quizInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.quiz.count({ where }),
    ])

    return {
      data: rows.map((q) => mapInstructorQuizListItem(q as QuizWithRelations)),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  async listStudentQuizzes(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: 'active' },
      select: { courseId: true },
    })
    const courseIds = enrollments.map((e) => e.courseId)

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        status: QuizStatus.published,
        visibility: { not: QuizVisibility.hidden },
        OR: [
          { courseId: { in: courseIds } },
          { isGeneric: true, visibility: QuizVisibility.public },
        ],
      },
      include: {
        course: true,
        attempts: { where: { enrollment: { studentId } }, orderBy: { attemptNumber: 'desc' } },
        _count: { select: { questions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const visible = quizzes.filter((q) => isQuizAvailable(q))
    return visible.map((q) =>
      mapStudentQuizListItem(q as unknown as QuizWithRelations, q.attempts, q.passScore),
    )
  }

  async getStudentAnalytics(studentId: string) {
    const results = await this.prisma.quizResult.findMany({
      where: { enrollment: { studentId } },
      include: { quiz: true },
      orderBy: { submittedAt: 'desc' },
    })
    if (!results.length) {
      return {
        averageScore: 0,
        quizzesTaken: 0,
        passRate: 0,
        strongestArea: '—',
        needsImprovement: '—',
        trend: '—',
      }
    }
    const avg = results.reduce((s, r) => s + r.percentage, 0) / results.length
    const passed = results.filter((r) => r.passed).length
    return {
      averageScore: Math.round(avg),
      quizzesTaken: results.length,
      passRate: Math.round((passed / results.length) * 100),
      strongestArea: results[0]?.quiz.title ?? '—',
      needsImprovement: results[results.length - 1]?.quiz.title ?? '—',
      trend: avg >= 70 ? 'Improving' : 'Needs focus',
    }
  }

  async createQuiz(instructorId: string, dto: CreateQuizDto) {
    const orgId = await this.defaultOrgId()
    const course = await this.resolveCourse(orgId, dto.courseSlug, instructorId)
    const isGeneric = dto.isGeneric ?? !course

    const quiz = await this.prisma.quiz.create({
      data: {
        organizationId: orgId,
        instructorId,
        courseId: isGeneric ? null : course?.id,
        moduleId: dto.moduleId,
        lessonId: dto.lessonId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        instructions: dto.instructions?.trim(),
        durationMinutes: dto.durationMinutes ?? 30,
        unlimitedDuration: dto.unlimitedDuration ?? false,
        maxAttempts: dto.maxAttempts ?? 3,
        passScore: dto.passScore ?? 70,
        isGeneric,
        randomizeQuestions: dto.randomizeQuestions ?? false,
        randomizeOptions: dto.randomizeOptions ?? false,
        negativeMarking: dto.negativeMarking ?? false,
        showScoreImmediately: dto.showScoreImmediately ?? true,
        showCorrectAnswers: dto.showCorrectAnswers ?? false,
        showExplanations: dto.showExplanations ?? false,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
        availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : undefined,
        visibility: dto.visibility ?? QuizVisibility.enrolled,
        status: QuizStatus.draft,
      },
      include: quizInclude,
    })
    return mapQuizDetail(quiz as QuizWithRelations)
  }

  async updateQuiz(quizId: string, instructorId: string, dto: UpdateQuizDto) {
    const existing = await this.getOwnedQuiz(quizId, instructorId)
    const orgId = await this.defaultOrgId()
    const course =
      dto.courseSlug !== undefined
        ? await this.resolveCourse(orgId, dto.courseSlug, instructorId)
        : undefined

    const quiz = await this.prisma.quiz.update({
      where: { id: existing.id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        instructions: dto.instructions?.trim(),
        courseId:
          dto.isGeneric === true
            ? null
            : dto.courseSlug !== undefined
              ? course?.id ?? null
              : undefined,
        isGeneric: dto.isGeneric,
        moduleId: dto.moduleId,
        lessonId: dto.lessonId,
        durationMinutes: dto.durationMinutes,
        unlimitedDuration: dto.unlimitedDuration,
        maxAttempts: dto.maxAttempts,
        passScore: dto.passScore,
        randomizeQuestions: dto.randomizeQuestions,
        randomizeOptions: dto.randomizeOptions,
        negativeMarking: dto.negativeMarking,
        showScoreImmediately: dto.showScoreImmediately,
        showCorrectAnswers: dto.showCorrectAnswers,
        showExplanations: dto.showExplanations,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
        availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : undefined,
        visibility: dto.visibility,
      },
      include: quizInclude,
    })
    return mapQuizDetail(quiz as QuizWithRelations)
  }

  async deleteQuiz(quizId: string, instructorId: string) {
    await this.getOwnedQuiz(quizId, instructorId)
    await this.prisma.quiz.delete({ where: { id: quizId } })
    return { message: 'Quiz deleted' }
  }

  async publishQuiz(quizId: string, instructorId: string) {
    const quiz = await this.getOwnedQuiz(quizId, instructorId)
    if (!quiz.questions.length) {
      throw new BadRequestException('Add at least one question before publishing')
    }
    await this.recalcTotalMarks(quizId)
    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.published },
      include: quizInclude,
    })

    if (quiz.courseId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: quiz.courseId, status: 'active' },
        include: { student: { include: { studentProfile: true } } },
      })
      for (const e of enrollments) {
        void this.notificationMail.sendQuizPublished({
          userId: e.studentId,
          email: e.student.email,
          name: e.student.studentProfile?.displayName ?? e.student.email,
          quizTitle: quiz.title,
          courseTitle: quiz.course?.title ?? 'Course',
          organizationId: quiz.organizationId,
        })
      }
    }

    return mapQuizDetail(updated as QuizWithRelations)
  }

  async unpublishQuiz(quizId: string, instructorId: string) {
    await this.getOwnedQuiz(quizId, instructorId)
    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.draft },
      include: quizInclude,
    })
    return mapQuizDetail(updated as QuizWithRelations)
  }

  async archiveQuiz(quizId: string, instructorId: string) {
    await this.getOwnedQuiz(quizId, instructorId)
    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.archived },
      include: quizInclude,
    })
    return mapQuizDetail(updated as QuizWithRelations)
  }

  async getQuizForInstructor(quizId: string, instructorId: string) {
    const quiz = await this.getOwnedQuiz(quizId, instructorId)
    return mapQuizDetail(quiz)
  }

  async setQuestions(quizId: string, instructorId: string, dto: SetQuizQuestionsDto) {
    await this.getOwnedQuiz(quizId, instructorId)
    const orgId = await this.defaultOrgId()

    const questionIds = dto.questions.map((q) => q.questionId)
    const owned = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, instructorId, organizationId: orgId, status: 'active' },
    })
    if (owned.length !== questionIds.length) {
      throw new BadRequestException('One or more questions are invalid or inaccessible')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.quizQuestion.deleteMany({ where: { quizId } })
      await tx.quizQuestion.createMany({
        data: dto.questions.map((q, i) => ({
          quizId,
          questionId: q.questionId,
          pinnedVersion: q.pinnedVersion,
          pointsOverride: q.pointsOverride,
          sortOrder: q.sortOrder ?? i + 1,
        })),
      })
    })

    await this.recalcTotalMarks(quizId)
    return this.getQuizForInstructor(quizId, instructorId)
  }

  async generateQuestions(quizId: string, instructorId: string, dto: GenerateQuizQuestionsDto) {
    await this.getOwnedQuiz(quizId, instructorId)
    const orgId = await this.defaultOrgId()

    const rules = {
      category: dto.category,
      tag: dto.tag,
      difficulty: dto.difficulty,
      count: dto.count,
    }
    const where = buildQuestionWhere(instructorId, orgId, rules)

    let pool = await this.prisma.question.findMany({ where, take: dto.count * 3 })
    if (pool.length < dto.count) {
      throw new BadRequestException(`Only ${pool.length} matching questions found; need ${dto.count}`)
    }

    pool = shuffleQuestions(pool).slice(0, dto.count)

    if (dto.replaceExisting) {
      await this.prisma.quizQuestion.deleteMany({ where: { quizId } })
    }

    const existing = await this.prisma.quizQuestion.count({ where: { quizId } })
    await this.prisma.quizQuestion.createMany({
      data: pool.map((q, i) => ({
        quizId,
        questionId: q.id,
        sortOrder: existing + i + 1,
      })),
    })

    await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        selectionMode: dto.mode,
        selectionRules: rules as Prisma.InputJsonValue,
      },
    })

    await this.recalcTotalMarks(quizId)
    return this.getQuizForInstructor(quizId, instructorId)
  }

  private async assertStudentAccess(quiz: QuizWithRelations, studentId: string) {
    if (quiz.visibility === QuizVisibility.hidden) {
      throw new ForbiddenException('Quiz is not available')
    }
    if (quiz.isGeneric && quiz.visibility === QuizVisibility.public) return null
    if (!quiz.courseId) throw new ForbiddenException('Enrollment required')
    const enrollment = await this.getStudentEnrollment(studentId, quiz.courseId)
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course')
    return enrollment
  }

  async getQuizForStudent(quizId: string, studentId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true, _count: { select: { questions: true } } },
    })
    if (!quiz || quiz.status !== QuizStatus.published) {
      throw new NotFoundException('Quiz not found')
    }
    if (!isQuizAvailable(quiz)) throw new BadRequestException('Quiz is not currently available')
    await this.assertStudentAccess(quiz as QuizWithRelations, studentId)

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, enrollment: { studentId } },
      orderBy: { attemptNumber: 'desc' },
    })
    return mapStudentQuizListItem(quiz as QuizWithRelations, attempts, quiz.passScore)
  }

  async startAttempt(quizId: string, studentId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: quizInclude,
    })
    if (!quiz || quiz.status !== QuizStatus.published) {
      throw new NotFoundException('Quiz not found')
    }
    if (!isQuizAvailable(quiz)) throw new BadRequestException('Quiz is not currently available')

    const enrollment = await this.assertStudentAccess(quiz as QuizWithRelations, studentId)
    if (!quiz.courseId && quiz.isGeneric) {
      throw new BadRequestException('Generic quizzes require course enrollment context')
    }
    const enroll =
      enrollment ??
      (await this.prisma.enrollment.findFirst({
        where: { studentId, status: 'active' },
      }))
    if (!enroll) throw new ForbiddenException('No active enrollment found')

    const existingInProgress = await this.prisma.quizAttempt.findFirst({
      where: { quizId, enrollmentId: enroll.id, status: QuizAttemptStatus.in_progress },
    })
    if (existingInProgress) {
      return this.getAttemptPlayer(existingInProgress.id, studentId)
    }

    const attemptCount = await this.prisma.quizAttempt.count({
      where: { quizId, enrollmentId: enroll.id },
    })
    if (attemptCount >= quiz.maxAttempts) {
      throw new BadRequestException('Maximum attempts reached')
    }

    const maxScore = quiz.totalMarks ?? computeTotalMarks(quiz.questions)
    const expiresAt =
      !quiz.unlimitedDuration && quiz.durationMinutes
        ? new Date(Date.now() + quiz.durationMinutes * 60_000)
        : null

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        enrollmentId: enroll.id,
        attemptNumber: attemptCount + 1,
        maxScore,
        status: QuizAttemptStatus.in_progress,
        expiresAt,
      },
    })

    return this.getAttemptPlayer(attempt.id, studentId)
  }

  async getAttemptPlayer(attemptId: string, studentId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: quizInclude },
        enrollment: true,
        answerRows: true,
      },
    })
    if (!attempt || attempt.enrollment.studentId !== studentId) {
      throw new NotFoundException('Attempt not found')
    }
    if (attempt.status !== QuizAttemptStatus.in_progress) {
      throw new BadRequestException('Attempt is not in progress')
    }

    if (attempt.expiresAt && attempt.expiresAt < new Date()) {
      await this.submitAttemptInternal(attempt.id, studentId)
      throw new BadRequestException('Time expired — attempt auto-submitted')
    }

    let questions = attempt.quiz.questions
    if (attempt.quiz.randomizeQuestions) {
      questions = shuffleQuestions(questions)
    }

    const saved = new Map(attempt.answerRows.map((a) => [a.quizQuestionId, a]))
    const flagged = (attempt.flaggedQuestionIds as string[]) ?? []

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      attemptNumber: attempt.attemptNumber,
      title: attempt.quiz.title,
      instructions: attempt.quiz.instructions,
      durationMinutes: attempt.quiz.durationMinutes,
      unlimitedDuration: attempt.quiz.unlimitedDuration,
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      startedAt: attempt.startedAt.toISOString(),
      questions: questions.map((qq) => ({
        ...mapPlayerQuestion(qq, {
          randomizeOptions: attempt.quiz.randomizeOptions,
          showCorrectAnswers: false,
          showExplanations: false,
        }),
        savedResponse: saved.get(qq.id)?.response ?? null,
        flagged: flagged.includes(qq.id),
      })),
    }
  }

  async saveAnswers(attemptId: string, studentId: string, dto: SaveQuizAnswersDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true, enrollment: true },
    })
    if (!attempt || attempt.enrollment.studentId !== studentId) {
      throw new NotFoundException('Attempt not found')
    }
    if (attempt.status !== QuizAttemptStatus.in_progress) {
      throw new BadRequestException('Attempt is not in progress')
    }

    const flaggedIds = dto.answers.filter((a) => a.flagged).map((a) => a.quizQuestionId)

    for (const ans of dto.answers) {
      const link = await this.prisma.quizQuestion.findFirst({
        where: { id: ans.quizQuestionId, quizId: attempt.quizId },
        include: { question: true },
      })
      if (!link) continue

      await this.prisma.quizAnswer.upsert({
        where: {
          attemptId_quizQuestionId: {
            attemptId,
            quizQuestionId: ans.quizQuestionId,
          },
        },
        create: {
          attemptId,
          quizQuestionId: ans.quizQuestionId,
          questionId: link.questionId,
          response: ans.response as Prisma.InputJsonValue,
          maxScore: link.pointsOverride ?? link.question.marks,
          gradingStatus: QuizAnswerGradingStatus.ungraded,
          flagged: ans.flagged ?? false,
        },
        update: {
          response: ans.response as Prisma.InputJsonValue,
          flagged: ans.flagged ?? false,
        },
      })
    }

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        flaggedQuestionIds: flaggedIds,
        lastSavedAt: new Date(),
        answers: Object.fromEntries(
          dto.answers.map((a) => [a.quizQuestionId, a.response]),
        ) as Prisma.InputJsonValue,
      },
    })

    return { saved: true, lastSavedAt: new Date().toISOString() }
  }

  private async submitAttemptInternal(attemptId: string, studentId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: quizInclude },
        enrollment: { include: { student: { include: { studentProfile: true } } } },
        answerRows: {
          include: {
            quizQuestion: { include: { question: { include: { optionRows: true } } } },
          },
        },
      },
    })
    if (!attempt || attempt.enrollment.studentId !== studentId) {
      throw new NotFoundException('Attempt not found')
    }
    if (attempt.status !== QuizAttemptStatus.in_progress) {
      throw new BadRequestException('Attempt already submitted')
    }

    const now = new Date()
    const timeTakenSeconds = Math.max(
      0,
      Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
    )

    const gradedAnswers: Array<{
      id: string
      score: number
      maxScore: number
      isCorrect: boolean | null
      gradingStatus: QuizAnswerGradingStatus
    }> = []

    for (const qq of attempt.quiz.questions) {
      let answerRow = attempt.answerRows.find((a) => a.quizQuestionId === qq.id)
      if (!answerRow) {
        answerRow = await this.prisma.quizAnswer.create({
          data: {
            attemptId,
            quizQuestionId: qq.id,
            questionId: qq.questionId,
            response: {},
            maxScore: qq.pointsOverride ?? qq.question.marks,
            gradingStatus: QuizAnswerGradingStatus.ungraded,
          },
          include: {
            quizQuestion: { include: { question: { include: { optionRows: true } } } },
          },
        }) as typeof attempt.answerRows[number]
      }

      const outcome = gradeResponse(
        {
          type: qq.question.type,
          marks: qq.pointsOverride ?? qq.question.marks,
          negativeMarks: qq.question.negativeMarks,
          correctAnswer: qq.question.correctAnswer,
          optionRows: qq.question.optionRows,
        },
        answerRow.response,
        attempt.quiz.negativeMarking,
      )

      const updated = await this.prisma.quizAnswer.update({
        where: { id: answerRow.id },
        data: {
          score: outcome.score,
          maxScore: outcome.maxScore,
          isCorrect: outcome.isCorrect,
          gradingStatus: outcome.gradingStatus,
        },
      })
      gradedAnswers.push({
        id: updated.id,
        score: updated.score ?? 0,
        maxScore: updated.maxScore,
        isCorrect: updated.isCorrect,
        gradingStatus: updated.gradingStatus,
      })
    }

    const totalScore = gradedAnswers.reduce((s, a) => s + (a.score ?? 0), 0)
    const maxScore = attempt.maxScore
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0
    const passThreshold = attempt.quiz.passScore ?? 70
    const passed = percentage >= passThreshold
    const pendingManual = isManualGradingPending(gradedAnswers)
    const status = pendingManual
      ? QuizAttemptStatus.pending_manual
      : QuizAttemptStatus.auto_graded

    const finalAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        percentage,
        passed,
        status,
        submittedAt: now,
        timeTakenSeconds,
      },
      include: attemptInclude,
    })

    await this.prisma.quizResult.create({
      data: {
        attemptId,
        quizId: attempt.quizId,
        enrollmentId: attempt.enrollmentId,
        attemptNumber: attempt.attemptNumber,
        totalScore,
        maxScore,
        percentage,
        passed,
        timeTakenSeconds,
        gradingStatus: status,
        startedAt: attempt.startedAt,
        submittedAt: now,
      },
    })

    const student = attempt.enrollment.student
    void this.notificationMail.sendQuizSubmitted({
      instructorId: attempt.quiz.instructorId,
      quizTitle: attempt.quiz.title,
      studentName: student.studentProfile?.displayName ?? student.email,
      organizationId: attempt.quiz.organizationId,
    })

    if (!pendingManual) {
      void this.notificationMail.sendQuizGraded({
        userId: student.id,
        email: student.email,
        name: student.studentProfile?.displayName ?? student.email,
        quizTitle: attempt.quiz.title,
        score: totalScore,
        maxScore,
        passed,
        organizationId: attempt.quiz.organizationId,
      })
    }

    void this.progressService.onQuizSubmitted(
      attempt.enrollmentId,
      attempt.quizId,
      passed ?? false,
    )

    return mapAttemptResult(
      finalAttempt as AttemptWithAnswers,
      attempt.quiz,
      attempt.quiz.showScoreImmediately,
    )
  }

  async submitAttempt(attemptId: string, studentId: string) {
    return this.submitAttemptInternal(attemptId, studentId)
  }

  async getAttemptResult(attemptId: string, userId: string, role: 'student' | 'instructor') {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { course: true } },
        enrollment: { include: { student: true } },
        ...attemptInclude,
      },
    })
    if (!attempt) throw new NotFoundException('Attempt not found')

    if (role === 'student' && attempt.enrollment.studentId !== userId) {
      throw new ForbiddenException('Access denied')
    }
    if (role === 'instructor' && attempt.quiz.instructorId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    const showDetails = role === 'instructor' || attempt.quiz.showScoreImmediately
    return mapAttemptResult(attempt as AttemptWithAnswers, attempt.quiz, showDetails)
  }

  async listStudentAttempts(quizId: string, studentId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, enrollment: { studentId } },
      orderBy: { attemptNumber: 'desc' },
      include: { result: true },
    })
    return attempts.map((a) => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      status: a.status,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString() ?? null,
      timeTakenSeconds: a.timeTakenSeconds,
    }))
  }

  async gradeAnswer(
    attemptId: string,
    answerId: string,
    instructorId: string,
    dto: GradeQuizAnswerDto,
  ) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true,
        enrollment: { include: { student: { include: { studentProfile: true } } } },
        answerRows: true,
        result: true,
      },
    })
    if (!attempt || attempt.quiz.instructorId !== instructorId) {
      throw new NotFoundException('Attempt not found')
    }

    const answer = await this.prisma.quizAnswer.findFirst({
      where: { id: answerId, attemptId },
    })
    if (!answer) throw new NotFoundException('Answer not found')
    if (dto.score > answer.maxScore) {
      throw new BadRequestException('Score exceeds maximum for this question')
    }

    await this.prisma.quizAnswer.update({
      where: { id: answerId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        isCorrect: dto.score >= answer.maxScore,
        gradingStatus: QuizAnswerGradingStatus.manually_graded,
      },
    })

    const answers = await this.prisma.quizAnswer.findMany({ where: { attemptId } })
    const pending = isManualGradingPending(answers)
    const totalScore = answers.reduce((s, a) => s + (a.score ?? 0), 0)
    const percentage =
      attempt.maxScore > 0 ? Math.round((totalScore / attempt.maxScore) * 10000) / 100 : 0
    const passed = percentage >= (attempt.quiz.passScore ?? 70)
    const status = pending ? QuizAttemptStatus.pending_manual : QuizAttemptStatus.graded

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score: totalScore, percentage, passed, status },
    })

    if (attempt.result) {
      await this.prisma.quizResult.update({
        where: { attemptId },
        data: { totalScore, percentage, passed, gradingStatus: status },
      })
    }

    if (!pending) {
      const student = attempt.enrollment.student
      void this.notificationMail.sendQuizGraded({
        userId: student.id,
        email: student.email,
        name: student.studentProfile?.displayName ?? student.email,
        quizTitle: attempt.quiz.title,
        score: totalScore,
        maxScore: attempt.maxScore,
        passed,
        organizationId: attempt.quiz.organizationId,
      })
    }

    return this.getAttemptResult(attemptId, instructorId, 'instructor')
  }

  async getInstructorAnalytics(quizId: string, instructorId: string) {
    const quiz = await this.getOwnedQuiz(quizId, instructorId)
    const results = await this.prisma.quizResult.findMany({
      where: { quizId },
      orderBy: { submittedAt: 'desc' },
    })

    if (!results.length) {
      return {
        quizId,
        title: quiz.title,
        attemptCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        attemptDistribution: [],
        difficultQuestions: [],
      }
    }

    const scores = results.map((r) => r.percentage)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const passed = results.filter((r) => r.passed).length

    const incorrect = await this.prisma.quizAnswer.groupBy({
      by: ['questionId'],
      where: { attempt: { quizId }, isCorrect: false },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const distribution = [0, 0, 0, 0, 0]
    for (const r of results) {
      const bucket = Math.min(4, Math.floor(r.percentage / 20))
      distribution[bucket]++
    }

    return {
      quizId,
      title: quiz.title,
      attemptCount: results.length,
      averageScore: Math.round(avg * 100) / 100,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: Math.round((passed / results.length) * 100),
      attemptDistribution: distribution.map((count, i) => ({
        range: `${i * 20}-${(i + 1) * 20}%`,
        count,
      })),
      difficultQuestions: incorrect.map((row) => ({
        questionId: row.questionId,
        incorrectCount: row._count.id,
      })),
    }
  }

  async listQuizAttemptsForInstructor(quizId: string, instructorId: string) {
    await this.getOwnedQuiz(quizId, instructorId)
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, status: { not: QuizAttemptStatus.in_progress } },
      include: {
        enrollment: {
          include: { student: { include: { studentProfile: true } } },
        },
        result: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    })

    return attempts.map((a) => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      studentName: a.enrollment.student.studentProfile?.displayName ?? a.enrollment.student.email,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      status: a.status,
      submittedAt: a.submittedAt?.toISOString() ?? null,
    }))
  }
}
