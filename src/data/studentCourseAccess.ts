/** Maps each mock student to their enrolled course IDs */
export const studentCourseAccess: Record<string, string[]> = {
  'stud-001': [
    'aws-solutions-architect',
    'it-project-management',
    'data-analytics-pro',
    'demo-course',
  ],
  'stud-002': ['aws-solutions-architect', 'it-project-management'],
}

export function courseIdsForStudent(studentId: string): Set<string> {
  return new Set(studentCourseAccess[studentId] ?? [])
}
