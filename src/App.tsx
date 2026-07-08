import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { MarketingLayout } from './layouts/MarketingLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { GuestRoute, ProtectedRoute } from './routes/ProtectedRoute'
import { LoadingState } from './components/ui/LoadingState'
import {
  StudentDownloadsComingSoon,
  StudentMessagesComingSoon,
  StudentCoachingComingSoon,
  InstructorEarningsComingSoon,
  InstructorMessagesComingSoon,
  InstructorAnnouncementsComingSoon,
  InstructorCoachingComingSoon,
} from './pages/dashboard/comingSoonPages'
import {
  StudentOverviewPage,
  StudentCoursesPage,
  StudentProgressPage,
  StudentAssignmentsPage,
  StudentQuizzesPage,
  StudentQuizStartPage,
  StudentQuizPlayerPage,
  StudentQuizResultPage,
  StudentCertificatesPage,
  StudentNotificationsPage,
  StudentSettingsPage,
  StudentCalendarPage,
  StudentBatchesPage,
  InstructorOverviewPage,
  InstructorCoursesPage,
  InstructorCourseEditorPage,
  InstructorCoursePreviewPage,
  InstructorStudentsPage,
  InstructorStudentProgressPage,
  InstructorNotificationsPage,
  InstructorCalendarPage,
  InstructorAnalyticsPage,
  InstructorProfilePage,
  InstructorSettingsPage,
  InstructorAssignmentsPage,
  InstructorQuizzesPage,
  InstructorQuestionBankPage,
  InstructorBatchesPage,
  InstructorBulkImportPage,
  InstructorCertificatesPage,
} from './routes/dashboardPages'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const VerifyCertificatePage = lazy(() =>
  import('./pages/VerifyCertificatePage').then((m) => ({ default: m.VerifyCertificatePage })),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const LoginLandingPage = lazy(() =>
  import('./pages/auth/AuthLandingPages').then((m) => ({ default: m.LoginLandingPage })),
)
const RegisterLandingPage = lazy(() =>
  import('./pages/auth/AuthLandingPages').then((m) => ({ default: m.RegisterLandingPage })),
)
const SignInPage = lazy(() => import('./pages/auth/AuthForms').then((m) => ({ default: m.SignInPage })))
const RegisterPage = lazy(() => import('./pages/auth/AuthForms').then((m) => ({ default: m.RegisterPage })))
const CheckEmailPage = lazy(() =>
  import('./pages/auth/CheckEmailPage').then((m) => ({ default: m.CheckEmailPage })),
)
const VerifyEmailPage = lazy(() =>
  import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ResetPasswordPage })),
)
const ResendVerificationPage = lazy(() =>
  import('./pages/auth/PasswordPages').then((m) => ({ default: m.ResendVerificationPage })),
)

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState label="Loading…" className="min-h-[50vh]" />}>{children}</Suspense>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public marketing */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<LazyPage><HomePage /></LazyPage>} />
            <Route path="/courses" element={<LazyPage><CoursesPage /></LazyPage>} />
            <Route path="/courses/:id" element={<LazyPage><CourseDetail /></LazyPage>} />
            <Route path="/verify/:credentialId" element={<LazyPage><VerifyCertificatePage /></LazyPage>} />
            <Route path="/verify" element={<LazyPage><VerifyCertificatePage /></LazyPage>} />
            <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
          </Route>

          {/* Auth — guest only */}
          <Route path="/login" element={<GuestRoute><LazyPage><LoginLandingPage /></LazyPage></GuestRoute>} />
          <Route path="/login/student" element={<GuestRoute><LazyPage><SignInPage role="student" /></LazyPage></GuestRoute>} />
          <Route path="/login/instructor" element={<GuestRoute><LazyPage><SignInPage role="instructor" /></LazyPage></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><LazyPage><RegisterLandingPage /></LazyPage></GuestRoute>} />
          <Route path="/register/student" element={<GuestRoute><LazyPage><RegisterPage role="student" /></LazyPage></GuestRoute>} />
          <Route path="/register/instructor" element={<GuestRoute><LazyPage><RegisterPage role="instructor" /></LazyPage></GuestRoute>} />
          <Route path="/check-email" element={<GuestRoute><LazyPage><CheckEmailPage /></LazyPage></GuestRoute>} />
          <Route path="/verify-email" element={<GuestRoute><LazyPage><VerifyEmailPage /></LazyPage></GuestRoute>} />
          <Route path="/resend-verification" element={<GuestRoute><LazyPage><ResendVerificationPage /></LazyPage></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><LazyPage><ForgotPasswordPage /></LazyPage></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><LazyPage><ResetPasswordPage /></LazyPage></GuestRoute>} />

          {/* Student dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <DashboardLayout role="student" />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentOverviewPage />} />
            <Route path="courses" element={<StudentCoursesPage />} />
            <Route path="progress" element={<StudentProgressPage />} />
            <Route path="assignments" element={<StudentAssignmentsPage />} />
            <Route path="quizzes" element={<StudentQuizzesPage />} />
            <Route path="quizzes/:quizId/start" element={<StudentQuizStartPage />} />
            <Route path="quizzes/:quizId/attempt/:attemptId" element={<StudentQuizPlayerPage />} />
            <Route path="quizzes/:quizId/results/:attemptId" element={<StudentQuizResultPage />} />
            <Route path="certificates" element={<StudentCertificatesPage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
            <Route path="calendar" element={<StudentCalendarPage />} />
            <Route path="batches" element={<StudentBatchesPage />} />
            <Route path="coaching" element={<StudentCoachingComingSoon />} />
            <Route path="messages" element={<StudentMessagesComingSoon />} />
            <Route path="downloads" element={<StudentDownloadsComingSoon />} />
            <Route path="roadmap" element={<Navigate to="/dashboard/progress" replace />} />
            <Route path="certifications" element={<Navigate to="/dashboard/progress" replace />} />
            <Route path="schedule" element={<Navigate to="/dashboard/calendar" replace />} />
            <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
          </Route>

          {/* Instructor dashboard */}
          <Route
            path="/instructor"
            element={
              <ProtectedRoute requiredRole="instructor">
                <DashboardLayout role="instructor" />
              </ProtectedRoute>
            }
          >
            <Route index element={<InstructorOverviewPage />} />
            <Route path="courses" element={<InstructorCoursesPage />} />
            <Route path="courses/new" element={<InstructorCourseEditorPage />} />
            <Route path="courses/:courseId/edit" element={<InstructorCourseEditorPage />} />
            <Route path="courses/:courseId/preview" element={<InstructorCoursePreviewPage />} />
            <Route path="students" element={<InstructorStudentsPage />} />
            <Route path="students/import" element={<InstructorBulkImportPage />} />
            <Route path="students/:studentId" element={<InstructorStudentProgressPage />} />
            <Route path="grades" element={<Navigate to="/instructor/assignments" replace />} />
            <Route path="assignments" element={<InstructorAssignmentsPage />} />
            <Route path="quizzes" element={<InstructorQuizzesPage />} />
            <Route path="question-bank" element={<InstructorQuestionBankPage />} />
            <Route path="certificates" element={<InstructorCertificatesPage />} />
            <Route path="batches" element={<InstructorBatchesPage />} />
            <Route path="coaching" element={<InstructorCoachingComingSoon />} />
            <Route path="announcements" element={<InstructorAnnouncementsComingSoon />} />
            <Route path="messages" element={<InstructorMessagesComingSoon />} />
            <Route path="notifications" element={<InstructorNotificationsPage />} />
            <Route path="calendar" element={<InstructorCalendarPage />} />
            <Route path="analytics" element={<InstructorAnalyticsPage />} />
            <Route path="profile" element={<InstructorProfilePage />} />
            <Route path="settings" element={<InstructorSettingsPage />} />
            <Route path="reviews" element={<Navigate to="/instructor/analytics" replace />} />
            <Route path="earnings" element={<InstructorEarningsComingSoon />} />
            <Route path="content" element={<Navigate to="/instructor/courses" replace />} />
            <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
