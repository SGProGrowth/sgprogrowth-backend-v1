import { apiRequest } from './client'
import type { PaginatedResponse } from './courses'

export interface EnrolledCourseDto {
  id: string
  title: string
  instructor: string
  coach: string
  category: string
  level: string
  duration: string
  progress: number
  modulesCompleted: number
  totalModules: number
  lastAccessed: string
  nextLesson: string
  status: 'active' | 'completed'
  thumbnail: string
  rating: number
  hoursSpent: number
}

export interface RecommendedCourseDto {
  id: string
  title: string
  instructor: string
  category: string
  level: string
  duration: string
  rating: number
  reviewCount: number
  price?: string
  badge?: string
  reason: string
}

export function enrollInCourse(courseSlug: string, batchId?: string) {
  return apiRequest<EnrolledCourseDto>('/enrollments', {
    method: 'POST',
    body: { courseSlug, batchId },
    auth: true,
  })
}

export function fetchMyEnrollments(page = 1, pageSize = 20) {
  return apiRequest<PaginatedResponse<EnrolledCourseDto>>(
    `/enrollments/me?page=${page}&pageSize=${pageSize}`,
    { auth: true },
  )
}

export function fetchCourseProgress(courseSlug: string) {
  return apiRequest<{
    courseId: string
    courseTitle: string
    status: string
    progressPct: number
    modulesCompleted: number
    totalModules: number
    totalLessons: number
    hoursSpent: number
    enrolledAt: string
    lastAccessedAt: string | null
    completedAt: string | null
    milestones: Array<{
      id: string
      phase: string
      title: string
      description: string
      status: string
      completedAt: string | null
    }>
  }>(`/enrollments/courses/${courseSlug}/progress`, { auth: true })
}

export function mapCatalogToRecommended(
  course: {
    id: string
    title: string
    instructor: string
    category: string
    level: string
    duration: string
    rating: number
    reviewCount: number
    price?: string
    badge?: string
  },
  reason = 'Popular in your field',
): RecommendedCourseDto {
  return { ...course, reason }
}
