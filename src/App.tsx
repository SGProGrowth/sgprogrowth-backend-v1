import { HomePage } from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetail from './pages/CourseDetail'

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  if (path === '/courses') {
    return <CoursesPage />
  }

  if (path.startsWith('/courses/')) {
    return <CourseDetail />
  }

  return <HomePage />
}

export default App
