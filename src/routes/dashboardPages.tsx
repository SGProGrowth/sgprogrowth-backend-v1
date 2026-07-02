import { lazy } from 'react'

export const StudentOverviewPage = lazy(() =>
  import('../pages/dashboard/student/StudentOverviewPage').then((m) => ({ default: m.StudentOverviewPage })),
)
export const StudentCoursesPage = lazy(() =>
  import('../pages/dashboard/student/StudentCoursesPage').then((m) => ({ default: m.StudentCoursesPage })),
)
export const StudentProgressPage = lazy(() =>
  import('../pages/dashboard/student/StudentProgressPage').then((m) => ({ default: m.StudentProgressPage })),
)
export const StudentAssignmentsPage = lazy(() =>
  import('../pages/dashboard/student/StudentAssignmentsPage').then((m) => ({ default: m.StudentAssignmentsPage })),
)
export const StudentQuizzesPage = lazy(() =>
  import('../pages/dashboard/student/StudentQuizzesPage').then((m) => ({ default: m.StudentQuizzesPage })),
)
export const StudentCertificatesPage = lazy(() =>
  import('../pages/dashboard/student/StudentCertificatesPage').then((m) => ({ default: m.StudentCertificatesPage })),
)
export const StudentNotificationsPage = lazy(() =>
  import('../pages/dashboard/student/StudentNotificationsPage').then((m) => ({ default: m.StudentNotificationsPage })),
)
export const StudentSettingsPage = lazy(() =>
  import('../pages/dashboard/student/StudentSettingsPage').then((m) => ({ default: m.StudentSettingsPage })),
)
export const StudentCalendarPage = lazy(() =>
  import('../pages/dashboard/student/StudentCalendarPage').then((m) => ({ default: m.StudentCalendarPage })),
)
export const StudentBatchesPage = lazy(() =>
  import('../pages/dashboard/student/StudentBatchesPage').then((m) => ({ default: m.StudentBatchesPage })),
)
export const StudentCoachingPage = lazy(() =>
  import('../pages/dashboard/student/StudentCoachingPage').then((m) => ({ default: m.StudentCoachingPage })),
)
export const StudentMessagesPage = lazy(() =>
  import('../pages/dashboard/student/StudentMessagesPage').then((m) => ({ default: m.StudentMessagesPage })),
)
export const StudentDownloadsPage = lazy(() =>
  import('../pages/dashboard/student/StudentDownloadsPage').then((m) => ({ default: m.StudentDownloadsPage })),
)

export const InstructorOverviewPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorOverviewPage').then((m) => ({ default: m.InstructorOverviewPage })),
)
export const InstructorCoursesPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorOverviewPage').then((m) => ({ default: m.InstructorCoursesPage })),
)
export const InstructorCourseEditorPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorCourseEditorPage').then((m) => ({ default: m.InstructorCourseEditorPage })),
)
export const InstructorCoursePreviewPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorCoursePreviewPage').then((m) => ({ default: m.InstructorCoursePreviewPage })),
)
export const InstructorStudentsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorStudentsPage').then((m) => ({ default: m.InstructorStudentsPage })),
)
export const InstructorStudentProgressPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorStudentsPage').then((m) => ({ default: m.InstructorStudentProgressPage })),
)
export const InstructorGradesPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorGradesPage').then((m) => ({ default: m.InstructorGradesPage })),
)
export const InstructorCoachingPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorCommunicationsPage').then((m) => ({ default: m.InstructorCoachingPage })),
)
export const InstructorAnnouncementsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorCommunicationsPage').then((m) => ({ default: m.InstructorAnnouncementsPage })),
)
export const InstructorMessagesPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorCommunicationsPage').then((m) => ({ default: m.InstructorMessagesPage })),
)
export const InstructorNotificationsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorInsightsPage').then((m) => ({ default: m.InstructorNotificationsPage })),
)
export const InstructorCalendarPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorInsightsPage').then((m) => ({ default: m.InstructorCalendarPage })),
)
export const InstructorAnalyticsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorInsightsPage').then((m) => ({ default: m.InstructorAnalyticsPage })),
)
export const InstructorProfilePage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorAccountPage').then((m) => ({ default: m.InstructorProfilePage })),
)
export const InstructorSettingsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorAccountPage').then((m) => ({ default: m.InstructorSettingsPage })),
)
export const InstructorAssignmentsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorAssignmentsPage').then((m) => ({ default: m.InstructorAssignmentsPage })),
)
export const StudentQuizStartPage = lazy(() =>
  import('../pages/dashboard/student/StudentQuizStartPage').then((m) => ({ default: m.StudentQuizStartPage })),
)
export const StudentQuizPlayerPage = lazy(() =>
  import('../pages/dashboard/student/StudentQuizPlayerPage').then((m) => ({ default: m.StudentQuizPlayerPage })),
)
export const StudentQuizResultPage = lazy(() =>
  import('../pages/dashboard/student/StudentQuizPlayerPage').then((m) => ({ default: m.StudentQuizResultPage })),
)
export const InstructorQuizzesPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorQuizzesPage').then((m) => ({ default: m.InstructorQuizzesPage })),
)
export const InstructorQuestionBankPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorQuestionBankPage').then((m) => ({ default: m.InstructorQuestionBankPage })),
)
export const InstructorCertificatesPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorCertificatesPage').then((m) => ({ default: m.InstructorCertificatesPage })),
)
export const InstructorBatchesPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorBatchesPage').then((m) => ({ default: m.InstructorBatchesPage })),
)
export const InstructorBulkImportPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorBulkImportPage').then((m) => ({ default: m.InstructorBulkImportPage })),
)
export const InstructorEarningsPage = lazy(() =>
  import('../pages/dashboard/instructor/InstructorEarningsPage').then((m) => ({ default: m.InstructorEarningsPage })),
)
