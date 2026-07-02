import { QuestionType, QuizAnswerGradingStatus } from '@prisma/client'

type QuestionForGrading = {
  type: QuestionType
  marks: number
  negativeMarks: number | null
  correctAnswer: unknown
  optionRows?: Array<{ id: string; text: string; isCorrect: boolean; label?: string | null }>
}

export type GradeOutcome = {
  score: number
  maxScore: number
  isCorrect: boolean | null
  gradingStatus: QuizAnswerGradingStatus
}

const MANUAL_TYPES: QuestionType[] = ['short_answer', 'long_answer', 'essay']

function norm(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (value == null) return []
  return [String(value)]
}

export function gradeResponse(
  question: QuestionForGrading,
  response: unknown,
  negativeMarking: boolean,
): GradeOutcome {
  const maxScore = question.marks

  if (MANUAL_TYPES.includes(question.type)) {
    return {
      score: 0,
      maxScore,
      isCorrect: null,
      gradingStatus: QuizAnswerGradingStatus.pending_manual,
    }
  }

  const correct = question.correctAnswer as Record<string, unknown>
  let isCorrect = false
  let partialRatio = 0

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false': {
      const expected = correct?.answer ?? correct?.answers
      const given = (response as { value?: unknown })?.value ?? response
      isCorrect = norm(given) === norm(expected) ||
        (question.optionRows?.some((o) => o.isCorrect && norm(o.text) === norm(given)) ?? false)
      break
    }
    case 'multiple_choice_multi': {
      const expectedSet = new Set(
        asArray(correct?.answer ?? correct?.answers).map(norm),
      )
      const givenArr = asArray((response as { values?: unknown })?.values ?? response).map(norm)
      const givenSet = new Set(givenArr)
      if (expectedSet.size === 0) break
      let matches = 0
      for (const v of expectedSet) {
        if (givenSet.has(v)) matches++
      }
      partialRatio = matches / expectedSet.size
      isCorrect = partialRatio === 1 && givenSet.size === expectedSet.size
      break
    }
    case 'fill_blank': {
      const expected = norm(correct?.answer ?? correct?.text)
      const given = norm((response as { value?: unknown })?.value ?? response)
      isCorrect = expected.length > 0 && given === expected
      break
    }
    case 'matching': {
      const expectedPairs = (correct?.pairs ?? []) as Array<{ key?: string; value?: string }>
      const givenPairs = ((response as { pairs?: unknown })?.pairs ?? response) as Array<{ key?: string; value?: string }>
      if (!expectedPairs.length) break
      let matches = 0
      for (const exp of expectedPairs) {
        const match = givenPairs.find((g) => norm(g.key) === norm(exp.key))
        if (match && norm(match.value) === norm(exp.value)) matches++
      }
      partialRatio = matches / expectedPairs.length
      isCorrect = partialRatio === 1
      break
    }
    case 'ordering': {
      const expectedOrder = asArray(correct?.order ?? correct?.answer)
      const givenOrder = asArray((response as { order?: unknown })?.order ?? response)
      isCorrect =
        expectedOrder.length > 0 &&
        expectedOrder.length === givenOrder.length &&
        expectedOrder.every((v, i) => norm(v) === norm(givenOrder[i]))
      partialRatio = isCorrect ? 1 : 0
      break
    }
    default:
      return {
        score: 0,
        maxScore,
        isCorrect: null,
        gradingStatus: QuizAnswerGradingStatus.pending_manual,
      }
  }

  let score = 0
  if (question.type === 'multiple_choice_multi' || question.type === 'matching') {
    score = Math.round(maxScore * partialRatio * 100) / 100
    if (isCorrect) score = maxScore
  } else if (isCorrect) {
    score = maxScore
  } else if (negativeMarking && question.negativeMarks) {
    score = -Math.abs(question.negativeMarks)
  }

  return {
    score,
    maxScore,
    isCorrect,
    gradingStatus: QuizAnswerGradingStatus.auto_graded,
  }
}

export function isManualGradingPending(answers: Array<{ gradingStatus: QuizAnswerGradingStatus }>) {
  return answers.some((a) => a.gradingStatus === QuizAnswerGradingStatus.pending_manual)
}
