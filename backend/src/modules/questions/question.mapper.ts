import { Question, QuestionDifficulty, QuestionOption, QuestionType } from '@prisma/client'

const UI_TO_DB: Record<string, QuestionType> = {
  'multiple-choice': 'multiple_choice',
  'multiple-choice-single': 'multiple_choice',
  'multiple-choice-multi': 'multiple_choice_multi',
  'true-false': 'true_false',
  'short-answer': 'short_answer',
  essay: 'essay',
  'long-answer': 'long_answer',
  'fill-blank': 'fill_blank',
  'fill-in-the-blank': 'fill_blank',
  matching: 'matching',
  ordering: 'ordering',
  sequence: 'ordering',
}

const DB_TO_UI: Record<QuestionType, string> = {
  multiple_choice: 'multiple-choice',
  multiple_choice_multi: 'multiple-choice-multi',
  true_false: 'true-false',
  short_answer: 'short-answer',
  essay: 'essay',
  long_answer: 'long-answer',
  fill_blank: 'fill-blank',
  matching: 'matching',
  ordering: 'ordering',
}

export function parseQuestionType(value: string): QuestionType {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_')
  if (UI_TO_DB[value]) return UI_TO_DB[value]
  if (Object.values(QuestionType).includes(normalized as QuestionType)) {
    return normalized as QuestionType
  }
  throw new Error(`Unsupported question type: ${value}`)
}

export function toUiQuestionType(type: QuestionType): string {
  return DB_TO_UI[type] ?? type
}

export function slugifyTag(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export type QuestionWithRelations = Question & {
  optionRows?: QuestionOption[]
  tagLinks?: Array<{ tag: { id: string; name: string; slug: string } }>
  bankCategory?: { id: string; name: string; slug: string; subject: string | null } | null
  course?: { slug: string; title: string } | null
  _count?: { quizQuestions: number }
  createdBy?: { instructorProfile?: { displayName: string } | null; email: string }
  updatedBy?: { instructorProfile?: { displayName: string } | null; email: string } | null
}

export function mapQuestionListItem(q: QuestionWithRelations) {
  const tags = q.tagLinks?.map((l) => l.tag.name) ?? q.tags
  return {
    id: q.id,
    instructorId: q.instructorId,
    title: q.title ?? q.questionText.slice(0, 80),
    question: q.questionText,
    type: toUiQuestionType(q.type),
    category: q.bankCategory?.name ?? q.category ?? 'General',
    categoryId: q.categoryId,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty as QuestionDifficulty,
    courseId: q.course?.slug,
    courseTitle: q.course?.title,
    tags,
    usedIn: q._count?.quizQuestions ?? 0,
    points: q.marks,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    estimatedSeconds: q.estimatedSeconds,
    status: q.status === 'active' ? ('active' as const) : ('archived' as const),
    currentVersion: q.currentVersion,
    updatedAt: q.updatedAt.toISOString(),
  }
}

export function mapQuestionDetail(q: QuestionWithRelations, apiPrefix: string) {
  const list = mapQuestionListItem(q)
  return {
    ...list,
    explanation: q.explanation,
    codeSnippet: q.codeSnippet,
    moduleId: q.moduleId,
    lessonId: q.lessonId,
    options: (q.optionRows ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      text: o.text,
      isCorrect: o.isCorrect,
      sortOrder: o.sortOrder,
      matchKey: o.matchKey,
      matchValue: o.matchValue,
    })),
    correctAnswer: q.correctAnswer,
    legacyOptions: q.options,
    attachments: [],
    createdBy:
      q.createdBy?.instructorProfile?.displayName ?? q.createdBy?.email ?? 'Instructor',
    updatedBy: q.updatedBy?.instructorProfile?.displayName ?? q.updatedBy?.email ?? null,
    createdAt: q.createdAt.toISOString(),
    previewUrl: `${apiPrefix}/${q.id}/preview`,
  }
}

export function buildQuestionSnapshot(q: QuestionWithRelations) {
  return {
    title: q.title,
    questionText: q.questionText,
    explanation: q.explanation,
    type: q.type,
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    estimatedSeconds: q.estimatedSeconds,
    category: q.category,
    categoryId: q.categoryId,
    subject: q.subject,
    topic: q.topic,
    courseId: q.courseId,
    moduleId: q.moduleId,
    lessonId: q.lessonId,
    codeSnippet: q.codeSnippet,
    tags: q.tags,
    options: q.options,
    correctAnswer: q.correctAnswer,
    optionRows: q.optionRows,
  }
}

export function buildOptionsJson(
  options: Array<{
    label?: string | null
    text: string
    isCorrect?: boolean
    sortOrder?: number
    matchKey?: string | null
    matchValue?: string | null
  }>,
  type: QuestionType,
) {
  if (type === 'true_false') {
    const correct = options.find((o) => o.isCorrect)?.text ?? 'True'
    return {
      options: { choices: ['True', 'False'] },
      correctAnswer: { answer: correct },
    }
  }
  if (type === 'multiple_choice' || type === 'multiple_choice_multi') {
    return {
      options: { choices: options.map((o) => o.text) },
      correctAnswer: {
        answer: options.filter((o) => o.isCorrect).map((o) => o.label ?? o.text),
      },
    }
  }
  if (type === 'matching') {
    return {
      options: { pairs: options.map((o) => ({ key: o.matchKey, value: o.matchValue ?? o.text })) },
      correctAnswer: { pairs: options.map((o) => ({ key: o.matchKey, value: o.matchValue ?? o.text })) },
    }
  }
  if (type === 'ordering') {
    return {
      options: { items: options.map((o) => o.text) },
      correctAnswer: { order: options.map((o) => o.text) },
    }
  }
  return {
    options: {},
    correctAnswer: options[0]?.text ? { answer: options[0].text } : {},
  }
}
