import { Prisma, Question, QuestionOption, Quiz, QuizAttempt, QuizQuestion, QuizResult } from '@prisma/client'
import { formatDateLabel } from '../../common/utils/course.util'

export type QuizWithRelations = Quiz & {
  course?: { slug: string; title: string } | null
  questions?: Array<
    QuizQuestion & {
      question: Question & { optionRows?: QuestionOption[] }
    }
  >
  _count?: { questions: number; attempts: number }
}

export type AttemptWithAnswers = QuizAttempt & {
  answerRows?: Array<{
    id: string
    quizQuestionId: string
    questionId: string
    response: unknown
    score: number | null
    maxScore: number
    isCorrect: boolean | null
    gradingStatus: string
    feedback: string | null
    flagged: boolean
    quizQuestion: QuizQuestion & { question: Question & { optionRows?: QuestionOption[] } }
  }>
  result?: QuizResult | null
}

export function computeTotalMarks(questions: Array<{ pointsOverride: number | null; question: { marks: number } }>) {
  return questions.reduce((sum, q) => sum + (q.pointsOverride ?? q.question.marks), 0)
}

export function mapInstructorQuizListItem(q: QuizWithRelations) {
  const questionCount = q._count?.questions ?? q.questions?.length ?? 0
  return {
    id: q.id,
    instructorId: q.instructorId,
    title: q.title,
    description: q.description,
    courseId: q.course?.slug ?? null,
    courseTitle: q.course?.title ?? (q.isGeneric ? 'All courses' : '—'),
    questions: questionCount,
    duration: q.unlimitedDuration ? 'Unlimited' : `${q.durationMinutes} min`,
    durationMinutes: q.durationMinutes,
    unlimitedDuration: q.unlimitedDuration,
    attempts: q.maxAttempts,
    maxAttempts: q.maxAttempts,
    passScore: q.passScore ?? undefined,
    totalMarks: q.totalMarks ?? undefined,
    status: q.status,
    isGeneric: q.isGeneric,
    visibility: q.visibility,
    lastUpdated: formatDateLabel(q.updatedAt),
    attemptCount: q._count?.attempts ?? 0,
  }
}

export function mapQuizDetail(q: QuizWithRelations) {
  const list = mapInstructorQuizListItem(q)
  return {
    ...list,
    instructions: q.instructions,
    randomizeQuestions: q.randomizeQuestions,
    randomizeOptions: q.randomizeOptions,
    negativeMarking: q.negativeMarking,
    showScoreImmediately: q.showScoreImmediately,
    showCorrectAnswers: q.showCorrectAnswers,
    showExplanations: q.showExplanations,
    availableFrom: q.availableFrom?.toISOString() ?? null,
    availableUntil: q.availableUntil?.toISOString() ?? null,
    selectionMode: q.selectionMode,
    selectionRules: q.selectionRules,
    moduleId: q.moduleId,
    lessonId: q.lessonId,
    quizQuestions: (q.questions ?? []).map(mapQuizQuestionLink),
  }
}

export function mapQuizQuestionLink(qq: QuizQuestion & { question: Question & { optionRows?: QuestionOption[] } }) {
  return {
    id: qq.id,
    questionId: qq.questionId,
    pinnedVersion: qq.pinnedVersion,
    sortOrder: qq.sortOrder,
    pointsOverride: qq.pointsOverride,
    points: qq.pointsOverride ?? qq.question.marks,
    questionText: qq.question.questionText,
    type: qq.question.type,
    difficulty: qq.question.difficulty,
    category: qq.question.category,
  }
}

export function mapStudentQuizListItem(
  q: QuizWithRelations,
  attempts: QuizAttempt[],
  passScore?: number | null,
) {
  const completed = attempts.filter(
    (a) => a.status === 'graded' || a.status === 'auto_graded' || a.status === 'submitted',
  )
  const inProgress = attempts.find((a) => a.status === 'in_progress')
  const best = completed.reduce<QuizAttempt | null>((acc, cur) => {
    if (!acc || (cur.score ?? 0) > (acc.score ?? 0)) return cur
    return acc
  }, null)
  const latest = attempts.sort((a, b) => b.attemptNumber - a.attemptNumber)[0]
  const isCompleted = Boolean(best?.submittedAt)
  const pct = passScore ?? 70

  return {
    id: q.id,
    title: q.title,
    courseId: q.course?.slug ?? '',
    courseTitle: q.course?.title ?? 'Platform quiz',
    date: latest?.submittedAt ? formatDateLabel(latest.submittedAt) : formatDateLabel(q.updatedAt),
    dateLabel: isCompleted ? formatDateLabel(best!.submittedAt!) : inProgress ? 'In progress' : 'Available',
    status: isCompleted ? ('completed' as const) : inProgress ? ('in_progress' as const) : ('upcoming' as const),
    score: best?.score ?? undefined,
    maxScore: best?.maxScore ?? q.totalMarks ?? 100,
    percentage: best?.percentage ?? undefined,
    passed: best?.passed ?? undefined,
    attempts: attempts.length,
    maxAttempts: q.maxAttempts,
    duration: q.unlimitedDuration ? 'Unlimited' : `${q.durationMinutes} min`,
    passScore: pct,
    inProgressAttemptId: inProgress?.id,
    latestAttemptId: latest?.submittedAt ? latest.id : best?.id,
  }
}

export function mapPlayerQuestion(
  qq: QuizQuestion & { question: Question & { optionRows?: QuestionOption[] } },
  opts: { randomizeOptions: boolean; showCorrectAnswers: boolean; showExplanations: boolean },
) {
  let options = (qq.question.optionRows ?? []).map((o) => ({
    id: o.id,
    label: o.label,
    text: o.text,
    sortOrder: o.sortOrder,
  }))
  if (opts.randomizeOptions && options.length > 1) {
    options = [...options].sort(() => Math.random() - 0.5)
  }
  return {
    quizQuestionId: qq.id,
    questionId: qq.questionId,
    questionText: qq.question.questionText,
    type: qq.question.type,
    points: qq.pointsOverride ?? qq.question.marks,
    codeSnippet: qq.question.codeSnippet,
    options,
    explanation: opts.showExplanations ? qq.question.explanation : undefined,
    correctAnswer: opts.showCorrectAnswers ? qq.question.correctAnswer : undefined,
  }
}

export function mapAttemptResult(
  attempt: AttemptWithAnswers,
  quiz: Quiz,
  showDetails: boolean,
) {
  const base = {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    attemptNumber: attempt.attemptNumber,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    passed: attempt.passed,
    status: attempt.status,
    timeTakenSeconds: attempt.timeTakenSeconds,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    showScore: quiz.showScoreImmediately || showDetails,
    showCorrectAnswers: quiz.showCorrectAnswers || showDetails,
    showExplanations: quiz.showExplanations || showDetails,
  }

  if (!showDetails && !quiz.showScoreImmediately) {
    return { ...base, answers: undefined }
  }

  return {
    ...base,
    answers: (attempt.answerRows ?? []).map((a) => ({
      quizQuestionId: a.quizQuestionId,
      questionId: a.questionId,
      questionText: a.quizQuestion.question.questionText,
      type: a.quizQuestion.question.type,
      response: a.response,
      score: a.score,
      maxScore: a.maxScore,
      isCorrect: quiz.showCorrectAnswers || showDetails ? a.isCorrect : undefined,
      feedback: a.feedback,
      explanation:
        (quiz.showExplanations || showDetails) ? a.quizQuestion.question.explanation : undefined,
      gradingStatus: a.gradingStatus,
    })),
  }
}

export function shuffleQuestions<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

export function isQuizAvailable(quiz: Quiz, now = new Date()) {
  if (quiz.status !== 'published') return false
  if (quiz.availableFrom && quiz.availableFrom > now) return false
  if (quiz.availableUntil && quiz.availableUntil < now) return false
  return true
}

export type SelectionRules = {
  category?: string
  tag?: string
  difficulty?: string
  count?: number
}

export function buildQuestionWhere(
  instructorId: string,
  orgId: string,
  rules: SelectionRules,
): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = {
    organizationId: orgId,
    instructorId,
    status: 'active',
  }
  if (rules.category) where.category = { equals: rules.category, mode: 'insensitive' }
  if (rules.difficulty) where.difficulty = rules.difficulty as Prisma.EnumQuestionDifficultyFilter['equals']
  if (rules.tag) where.tags = { has: rules.tag }
  return where
}
