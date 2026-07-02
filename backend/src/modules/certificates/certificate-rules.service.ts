import { Injectable } from '@nestjs/common'
import {
  CertificateCompletionRule,
  LessonProgressStatus,
  QuizAttemptStatus,
} from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.module'

export type RuleEvaluation = {
  eligible: boolean
  failures: string[]
  rule: CertificateCompletionRule | null
}

@Injectable()
export class CertificateRulesService {
  constructor(private prisma: PrismaService) {}

  defaultRule(): Omit<CertificateCompletionRule, 'id' | 'courseId' | 'createdAt' | 'updatedAt'> {
    return {
      requireProgressPct: 100,
      requireAllLessons: true,
      requireAssignmentsSubmitted: false,
      minAssignmentScorePct: null,
      requireQuizPass: false,
      minQuizPassPct: 70,
      requireLiveSessions: false,
    }
  }

  async getRuleForCourse(courseId: string) {
    return this.prisma.certificateCompletionRule.findUnique({ where: { courseId } })
  }

  async evaluateEnrollment(enrollmentId: string): Promise<RuleEvaluation> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: { include: { lessons: true } },
            assignments: { where: { status: 'published' } },
            quizzes: { where: { status: 'published' } },
          },
        },
        lessonProgress: true,
        submissions: true,
        quizAttempts: true,
        coachingSessions: true,
      },
    })
    if (!enrollment) {
      return { eligible: false, failures: ['Enrollment not found'], rule: null }
    }

    const rule =
      (await this.getRuleForCourse(enrollment.courseId)) ??
      ({
        id: '',
        courseId: enrollment.courseId,
        ...this.defaultRule(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CertificateCompletionRule)

    const failures: string[] = []

    if (enrollment.progressPct < rule.requireProgressPct) {
      failures.push(`Course progress must be at least ${rule.requireProgressPct}%`)
    }

    if (rule.requireAllLessons) {
      const totalLessons = enrollment.course.modules.reduce((s, m) => s + m.lessons.length, 0)
      const completed = enrollment.lessonProgress.filter(
        (lp) => lp.status === LessonProgressStatus.completed,
      ).length
      if (totalLessons > 0 && completed < totalLessons) {
        failures.push('All lessons must be completed')
      }
    }

    if (rule.requireAssignmentsSubmitted) {
      const publishedIds = enrollment.course.assignments.map((a) => a.id)
      const submittedIds = new Set(
        enrollment.submissions
          .filter((s) => ['submitted', 'graded', 'late'].includes(s.status))
          .map((s) => s.assignmentId),
      )
      const missing = publishedIds.filter((id) => !submittedIds.has(id))
      if (missing.length) failures.push('All published assignments must be submitted')
    }

    if (rule.minAssignmentScorePct != null) {
      const graded = enrollment.submissions.filter(
        (s) => s.status === 'graded' && s.score != null,
      )
      for (const sub of graded) {
        const assignment = enrollment.course.assignments.find((a) => a.id === sub.assignmentId)
        if (!assignment?.maxScore) continue
        const pct = Math.round(((sub.score ?? 0) / assignment.maxScore) * 100)
        if (pct < rule.minAssignmentScorePct) {
          failures.push(`Minimum assignment score of ${rule.minAssignmentScorePct}% required`)
          break
        }
      }
    }

    if (rule.requireQuizPass) {
      const publishedQuizIds = enrollment.course.quizzes.map((q) => q.id)
      const passedQuizIds = new Set(
        enrollment.quizAttempts
          .filter(
            (a) =>
              publishedQuizIds.includes(a.quizId) &&
              a.passed === true &&
              ['submitted', 'auto_graded', 'graded', 'pending_manual'].includes(
                a.status as QuizAttemptStatus,
              ),
          )
          .map((a) => a.quizId),
      )
      const missingQuiz = publishedQuizIds.filter((id) => !passedQuizIds.has(id))
      if (missingQuiz.length) {
        failures.push(`All published quizzes must be passed (${rule.minQuizPassPct}% minimum)`)
      }
    }

    if (rule.requireLiveSessions) {
      const attended = enrollment.coachingSessions.filter((s) => s.status === 'completed').length
      if (attended === 0) failures.push('Mandatory live sessions must be attended')
    }

    return { eligible: failures.length === 0, failures, rule }
  }
}
