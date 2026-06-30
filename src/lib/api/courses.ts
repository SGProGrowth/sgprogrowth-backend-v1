import { apiRequest } from './client'
import type { Course } from '../../data/homepageData'
import type { InstructorCourse, CourseModule } from '../../data/instructorData'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CatalogCourseDto {
  id: string
  title: string
  instructor: string
  instructorUrl: string
  rating: number
  reviewCount: number
  price?: string
  badge?: string
  ctaLabel: string
  category: string
  categorySlug?: string
  level: string
  duration: string
  learners?: string
  trending?: boolean
  isNew?: boolean
  forTeams?: boolean
  featured?: boolean
  coachingIncluded?: boolean
  thumbnail?: string
  subtitle?: string
}

export interface CatalogCourseDetailDto extends CatalogCourseDto {
  description: string
  learningOutcomes: string[]
  requirements: string[]
  visibility?: string
  moduleCount: number
  lessonCount: number
  modules: Array<{ id: string; title: string; order: number; lessonCount: number }>
}

export interface CourseDetailResponse {
  access: 'public' | 'owner' | 'enrolled'
  course: CatalogCourseDetailDto | InstructorCourse
}

export interface CourseCatalogParams {
  page?: number
  pageSize?: number
  q?: string
  category?: string
  instructorId?: string
  level?: string
  sort?: 'relevance' | 'rating' | 'newest' | 'title' | 'duration'
  featured?: boolean
  trending?: boolean
  forTeams?: boolean
}

export interface CreateCoursePayload {
  title: string
  subtitle?: string
  description?: string
  categorySlug?: string
  level?: string
  durationHours?: number
  priceCents?: number
  visibility?: 'public' | 'private' | 'invite'
  coachingIncluded?: boolean
  thumbnailUrl?: string
  bannerUrl?: string
  learningOutcomes?: string[]
  requirements?: string[]
}

export type UpdateCoursePayload = Partial<CreateCoursePayload> & {
  featured?: boolean
  trending?: boolean
  isNew?: boolean
  forTeams?: boolean
}

export function mapCatalogCourseToUi(dto: CatalogCourseDto): Course {
  return {
    id: dto.id,
    title: dto.title,
    instructor: dto.instructor,
    instructorUrl: dto.instructorUrl,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    price: dto.price,
    badge: dto.badge,
    ctaLabel: dto.ctaLabel,
    category: dto.category,
    level: dto.level,
    duration: dto.duration,
    learners: dto.learners,
    trending: dto.trending,
    isNew: dto.isNew,
    forTeams: dto.forTeams,
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function fetchCourseCatalog(params: CourseCatalogParams = {}) {
  return apiRequest<PaginatedResponse<CatalogCourseDto>>(
    `/courses${buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
  )
}

export function fetchCourseBySlug(slug: string) {
  return apiRequest<CourseDetailResponse>(`/courses/${slug}`)
}

export function fetchMyInstructorCourses(params: { page?: number; pageSize?: number; status?: string } = {}) {
  return apiRequest<PaginatedResponse<InstructorCourse>>(
    `/courses/mine${buildQuery(params)}`,
    { auth: true },
  )
}

export function createCourse(payload: CreateCoursePayload) {
  return apiRequest<InstructorCourse>('/courses', {
    method: 'POST',
    body: payload,
    auth: true,
  })
}

export function updateCourse(slug: string, payload: UpdateCoursePayload) {
  return apiRequest<InstructorCourse>(`/courses/${slug}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  })
}

export function publishCourse(slug: string) {
  return apiRequest<InstructorCourse>(`/courses/${slug}/publish`, {
    method: 'POST',
    auth: true,
  })
}

export function unpublishCourse(slug: string) {
  return apiRequest<InstructorCourse>(`/courses/${slug}/unpublish`, {
    method: 'POST',
    auth: true,
  })
}

export function archiveCourse(slug: string) {
  return apiRequest<InstructorCourse>(`/courses/${slug}/archive`, {
    method: 'POST',
    auth: true,
  })
}

export function replaceCourseCurriculum(slug: string, modules: CourseModule[]) {
  return apiRequest<CourseModule[]>(`/courses/${slug}/curriculum`, {
    method: 'PUT',
    body: {
      modules: modules.map((m) => ({
        id: m.id.startsWith('new-') ? undefined : m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map((l) => ({
          id: l.id.startsWith('new-') ? undefined : l.id,
          title: l.title,
          type: l.type,
          durationMinutes: l.duration ? parseInt(l.duration, 10) || undefined : undefined,
          order: l.order,
        })),
      })),
    },
    auth: true,
  })
}

export function parseDurationWeeks(duration: string): number | undefined {
  const match = duration.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

export function parsePriceToCents(price: string): number {
  const digits = price.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) * 100 : 0
}

export function instructorCourseToPayload(course: Partial<InstructorCourse>): UpdateCoursePayload {
  return {
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    categorySlug: course.categoryId,
    level: course.level,
    durationHours: course.duration ? parseDurationWeeks(course.duration) : undefined,
    priceCents: course.price ? parsePriceToCents(course.price) : undefined,
    visibility: course.visibility,
    coachingIncluded: course.coachingIncluded,
    learningOutcomes: course.learningOutcomes?.filter(Boolean),
    requirements: course.requirements?.filter(Boolean),
  }
}
