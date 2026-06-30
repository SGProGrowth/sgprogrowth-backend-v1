import { apiRequest } from './client'
import type { StudentWorkspace } from '../studentWorkspace'
import type { InstructorWorkspace } from '../instructorWorkspace'

export function fetchStudentWorkspace(): Promise<StudentWorkspace> {
  return apiRequest<StudentWorkspace>('/students/me', { auth: true })
}

export function fetchInstructorWorkspace(): Promise<InstructorWorkspace> {
  return apiRequest<InstructorWorkspace>('/instructors/me', { auth: true })
}
