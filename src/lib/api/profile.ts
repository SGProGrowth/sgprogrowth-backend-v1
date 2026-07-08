import { apiRequest } from './client'
import type { StudentWorkspace } from '../studentWorkspace'
import type { InstructorWorkspace } from '../instructorWorkspace'

export interface UpdateStudentProfilePayload {
  displayName?: string
  phone?: string
  title?: string
  bio?: string
  organizationLabel?: string
  timezone?: string
  avatarUrl?: string
  preferences?: Record<string, unknown>
}

export interface UpdateInstructorProfilePayload {
  displayName?: string
  phone?: string
  designation?: string
  title?: string
  bio?: string
  experience?: string
  organizationLabel?: string
  avatarUrl?: string
}

export function updateStudentProfile(payload: UpdateStudentProfilePayload) {
  return apiRequest<StudentWorkspace>('/students/me/profile', {
    method: 'PATCH',
    body: payload,
    auth: true,
  })
}

export function updateInstructorProfile(payload: UpdateInstructorProfilePayload) {
  return apiRequest<InstructorWorkspace>('/instructors/me/profile', {
    method: 'PATCH',
    body: payload,
    auth: true,
  })
}

export function markStudentNotificationRead(id: string) {
  return apiRequest<{ message: string }>(`/students/me/notifications/${id}/read`, {
    method: 'PATCH',
    auth: true,
  })
}

export function markInstructorNotificationRead(id: string) {
  return apiRequest<{ message: string }>(`/instructors/me/notifications/${id}/read`, {
    method: 'PATCH',
    auth: true,
  })
}

export function markAllStudentNotificationsRead() {
  return apiRequest<{ message: string }>('/students/me/notifications/read-all', {
    method: 'POST',
    auth: true,
  })
}

export function markAllInstructorNotificationsRead() {
  return apiRequest<{ message: string }>('/instructors/me/notifications/read-all', {
    method: 'POST',
    auth: true,
  })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    auth: true,
  })
}
