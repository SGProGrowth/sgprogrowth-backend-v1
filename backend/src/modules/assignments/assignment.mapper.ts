import {
  Assignment,
  AssignmentAttachment,
  AssignmentGrade,
  AssignmentSubmission,
  AssignmentVisibility,
  Course,
  SubmissionAttachment,
  SubmissionStatus,
} from '@prisma/client'
import { formatDateLabel } from '../../common/utils/course.util'
import type {
  AssignmentDetailDto,
  AssignmentListItemDto,
  FileAttachmentDto,
  GradeHistoryDto,
  InstructorSubmissionDto,
  SubmissionDto,
} from '../../common/dto/assignment.dto'

type AssignmentWithCourse = Assignment & {
  course: Course
  attachments?: AssignmentAttachment[]
  _count?: { submissions: number }
}

type SubmissionWithRelations = AssignmentSubmission & {
  files?: SubmissionAttachment[]
  enrollment?: {
    student: {
      id: string
      email: string
      studentProfile?: { displayName: string } | null
    }
  }
  grades?: Array<AssignmentGrade & { grader?: { instructorProfile?: { displayName: string } | null; email: string } }>
}

const MS_DAY = 86_400_000

export function mapFileAttachment(
  file: { id: string; filename: string; mimeType: string; sizeBytes: number },
  downloadPath?: string,
): FileAttachmentDto {
  return {
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    downloadUrl: downloadPath,
  }
}

export function computeDueWarnings(dueAt: Date | null | undefined): {
  dueLabel: string
  isOverdue: boolean
  dueSoon: boolean
} {
  if (!dueAt) {
    return { dueLabel: 'No due date', isOverdue: false, dueSoon: false }
  }

  const now = Date.now()
  const dueMs = dueAt.getTime()
  const isOverdue = dueMs < now
  const dueSoon = !isOverdue && dueMs - now <= 2 * MS_DAY
  const dueLabel = isOverdue
    ? `Overdue · ${formatDateLabel(dueAt)}`
    : dueSoon
      ? `Due soon · ${formatDateLabel(dueAt)}`
      : formatDateLabel(dueAt)

  return { dueLabel, isOverdue, dueSoon }
}

export function mapStudentSubmissionStatus(
  assignment: Assignment,
  submission?: AssignmentSubmission | null,
): 'pending' | 'submitted' | 'graded' | 'overdue' {
  if (submission?.status === SubmissionStatus.graded) return 'graded'
  if (
    submission?.status === SubmissionStatus.submitted ||
    submission?.status === SubmissionStatus.late
  ) {
    return 'submitted'
  }
  if (submission?.status === SubmissionStatus.returned) return 'pending'
  if (assignment.dueAt && assignment.dueAt < new Date()) return 'overdue'
  return 'pending'
}

export function mapInstructorAssignmentListItem(
  assignment: AssignmentWithCourse,
  stats?: { submissions: number; totalStudents: number },
): AssignmentListItemDto {
  const { dueLabel } = computeDueWarnings(assignment.dueAt)
  return {
    id: assignment.id,
    title: assignment.title,
    courseId: assignment.course.slug,
    courseTitle: assignment.course.title,
    dueDate: assignment.dueAt ? formatDateLabel(assignment.dueAt) : 'No due date',
    dueLabel,
    type: assignment.type,
    status: assignment.status,
    maxScore: assignment.maxScore,
    allowLate: assignment.allowLate,
    submissions: stats?.submissions ?? assignment._count?.submissions,
    totalStudents: stats?.totalStudents,
  }
}

export function mapStudentAssignmentListItem(
  assignment: AssignmentWithCourse,
  submission?: AssignmentSubmission | null,
): AssignmentListItemDto {
  const { dueLabel, isOverdue, dueSoon } = computeDueWarnings(assignment.dueAt)
  return {
    id: assignment.id,
    title: assignment.title,
    courseId: assignment.course.slug,
    courseTitle: assignment.course.title,
    dueDate: assignment.dueAt ? formatDateLabel(assignment.dueAt) : 'No due date',
    dueLabel,
    type: assignment.type as AssignmentListItemDto['type'],
    status: assignment.status,
    maxScore: assignment.maxScore,
    allowLate: assignment.allowLate,
    submissionStatus: mapStudentSubmissionStatus(assignment, submission),
    score: submission?.score ?? undefined,
    isOverdue,
    dueSoon,
  }
}

export function mapAssignmentDetail(
  assignment: AssignmentWithCourse,
  basePath: string,
): AssignmentDetailDto {
  const list = mapInstructorAssignmentListItem(assignment)
  return {
    ...list,
    instructions: assignment.instructions ?? undefined,
    moduleId: assignment.moduleId,
    lessonId: assignment.lessonId,
    allowResubmission: assignment.allowResubmission,
    allowedFileTypes: assignment.allowedFileTypes,
    maxFileSizeBytes: assignment.maxFileSizeBytes,
    visibility: assignment.visibility,
    latePenaltyPct: assignment.latePenaltyPct,
    attachments: (assignment.attachments ?? []).map((a) =>
      mapFileAttachment(a, `${basePath}/${assignment.id}/attachments/${a.id}/download`),
    ),
  }
}

export function mapSubmission(
  submission: SubmissionWithRelations,
  basePath: string,
  assignmentId: string,
): SubmissionDto {
  const activeFiles = (submission.files ?? []).filter((f) => f.isActive)
  const historyFiles = (submission.files ?? []).filter((f) => !f.isActive)

  return {
    id: submission.id,
    status: submission.status,
    body: submission.body,
    score: submission.score,
    feedback: submission.feedback,
    attemptCount: submission.attemptCount,
    submittedAt: submission.submittedAt ? formatDateLabel(submission.submittedAt) : null,
    gradedAt: submission.gradedAt ? formatDateLabel(submission.gradedAt) : null,
    returnedAt: submission.returnedAt ? formatDateLabel(submission.returnedAt) : null,
    files: activeFiles.map((f) =>
      mapFileAttachment(f, `${basePath}/${assignmentId}/submissions/mine/files/${f.id}/download`),
    ),
    historyFiles: historyFiles.map((f) =>
      mapFileAttachment(f, `${basePath}/${assignmentId}/submissions/mine/files/${f.id}/download`),
    ),
  }
}

export function mapInstructorSubmission(
  submission: SubmissionWithRelations,
  basePath: string,
  assignmentId: string,
): InstructorSubmissionDto {
  const student = submission.enrollment?.student
  return {
    ...mapSubmission(submission, basePath, assignmentId),
    studentId: student?.id ?? '',
    studentName: student?.studentProfile?.displayName ?? student?.email ?? 'Student',
    studentEmail: student?.email ?? '',
    enrollmentId: submission.enrollmentId,
    files: (submission.files ?? [])
      .filter((f) => f.isActive)
      .map((f) =>
        mapFileAttachment(
          f,
          `${basePath}/${assignmentId}/submissions/${submission.id}/files/${f.id}/download`,
        ),
      ),
  }
}

export function mapGradeHistory(
  grade: AssignmentGrade & { grader?: { instructorProfile?: { displayName: string } | null; email: string } },
): GradeHistoryDto {
  return {
    id: grade.id,
    score: grade.score,
    maxScore: grade.maxScore,
    feedback: grade.feedback,
    returned: grade.returned,
    gradedAt: formatDateLabel(grade.gradedAt),
    graderName: grade.grader?.instructorProfile?.displayName ?? grade.grader?.email ?? 'Instructor',
  }
}

export function isVisibleToStudent(assignment: Assignment): boolean {
  return (
    assignment.status === 'published' &&
    assignment.visibility !== AssignmentVisibility.hidden
  )
}

export function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'text/plain': 'txt',
    'application/zip': 'zip',
  }
  return map[mime] ?? mime.split('/').pop() ?? 'bin'
}
