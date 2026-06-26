import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { MarketingLayout } from './layouts/MarketingLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginLandingPage, RegisterLandingPage } from './pages/auth/AuthLandingPages'
import { RegisterPage, SignInPage } from './pages/auth/AuthForms'
import { GuestRoute, ProtectedRoute } from './routes/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetail from './pages/CourseDetail'
import { NotFoundPage } from './pages/NotFoundPage'
import { StudentOverviewPage } from './pages/dashboard/student/StudentOverviewPage'
import { StudentCoursesPage } from './pages/dashboard/student/StudentCoursesPage'
import { StudentProgressPage } from './pages/dashboard/student/StudentProgressPage'
import { StudentAssignmentsPage } from './pages/dashboard/student/StudentAssignmentsPage'
import { StudentQuizzesPage } from './pages/dashboard/student/StudentQuizzesPage'
import { StudentCertificatesPage } from './pages/dashboard/student/StudentCertificatesPage'
import { StudentNotificationsPage } from './pages/dashboard/student/StudentNotificationsPage'
import { StudentSettingsPage } from './pages/dashboard/student/StudentSettingsPage'
import { InstructorOverviewPage, InstructorCoursesPage } from './pages/dashboard/instructor/InstructorOverviewPage'
import { InstructorCourseEditorPage } from './pages/dashboard/instructor/InstructorCourseEditorPage'
import { InstructorCoursePreviewPage } from './pages/dashboard/instructor/InstructorCoursePreviewPage'
import { InstructorStudentsPage, InstructorStudentProgressPage } from './pages/dashboard/instructor/InstructorStudentsPage'
import { InstructorGradesPage } from './pages/dashboard/instructor/InstructorGradesPage'
import { InstructorCoachingPage, InstructorAnnouncementsPage, InstructorMessagesPage } from './pages/dashboard/instructor/InstructorCommunicationsPage'
import { InstructorNotificationsPage, InstructorCalendarPage, InstructorAnalyticsPage } from './pages/dashboard/instructor/InstructorInsightsPage'
import { InstructorProfilePage, InstructorSettingsPage } from './pages/dashboard/instructor/InstructorAccountPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public marketing */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Auth — guest only */}
          <Route path="/login" element={<GuestRoute><LoginLandingPage /></GuestRoute>} />
          <Route path="/login/student" element={<GuestRoute><SignInPage role="student" /></GuestRoute>} />
          <Route path="/login/instructor" element={<GuestRoute><SignInPage role="instructor" /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterLandingPage /></GuestRoute>} />
          <Route path="/register/student" element={<GuestRoute><RegisterPage role="student" /></GuestRoute>} />
          <Route path="/register/instructor" element={<GuestRoute><RegisterPage role="instructor" /></GuestRoute>} />

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
            <Route path="certificates" element={<StudentCertificatesPage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
            <Route path="coaching" element={<Navigate to="/dashboard" replace />} />
            <Route path="roadmap" element={<Navigate to="/dashboard/progress" replace />} />
            <Route path="certifications" element={<Navigate to="/dashboard/progress" replace />} />
            <Route path="schedule" element={<Navigate to="/dashboard" replace />} />
            <Route path="messages" element={<Navigate to="/dashboard/notifications" replace />} />
            <Route path="*" element={<NotFoundPage />} />
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
            <Route path="students/:studentId" element={<InstructorStudentProgressPage />} />
            <Route path="grades" element={<InstructorGradesPage />} />
            <Route path="coaching" element={<InstructorCoachingPage />} />
            <Route path="announcements" element={<InstructorAnnouncementsPage />} />
            <Route path="messages" element={<InstructorMessagesPage />} />
            <Route path="notifications" element={<InstructorNotificationsPage />} />
            <Route path="calendar" element={<InstructorCalendarPage />} />
            <Route path="analytics" element={<InstructorAnalyticsPage />} />
            <Route path="profile" element={<InstructorProfilePage />} />
            <Route path="settings" element={<InstructorSettingsPage />} />
            <Route path="reviews" element={<Navigate to="/instructor/analytics" replace />} />
            <Route path="earnings" element={<Navigate to="/instructor/analytics" replace />} />
            <Route path="content" element={<Navigate to="/instructor/courses" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
