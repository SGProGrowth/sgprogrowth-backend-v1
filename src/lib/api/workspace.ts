import { apiRequest } from './client'
import type { StudentWorkspace } from '../studentWorkspace'
import type { InstructorWorkspace } from '../instructorWorkspace'

export function fetchStudentWorkspace(signal?: AbortSignal): Promise<StudentWorkspace> {
  return apiRequest<StudentWorkspace>('/students/me', { auth: true, signal })
}

export function fetchInstructorWorkspace(signal?: AbortSignal): Promise<InstructorWorkspace> {
  return apiRequest<InstructorWorkspace>('/instructors/me', { auth: true, signal })
}
