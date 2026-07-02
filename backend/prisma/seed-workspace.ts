import {
  AssignmentStatus,
  BatchStatus,
  CoachingSessionStatus,
  CourseStatus,
  EnrollmentStatus,
  NotificationType,
  PrismaClient,
  QuizStatus,
} from '@prisma/client'

const DEMO_PASSWORD = 'Password123!'

async function getUserByEmail(prisma: PrismaClient, email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error(`Seed user not found: ${email}. Run base seed first.`)
  return user
}

async function getCategoryId(prisma: PrismaClient, slug: string) {
  const cat = await prisma.category.findUnique({ where: { slug } })
  if (!cat) throw new Error(`Category not found: ${slug}`)
  return cat.id
}

export async function seedWorkspace(prisma: PrismaClient) {
  const orgSlug = process.env.DEFAULT_ORGANIZATION_SLUG ?? 'sg-pro-growth'
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } })
  if (!org) throw new Error('Organization not found. Run base seed first.')

  const existing = await prisma.course.findFirst({
    where: { organizationId: org.id, slug: 'aws-solutions-architect' },
  })
  if (existing) {
    console.log('Workspace seed already applied — skipping.')
    return
  }

  const aanya = await getUserByEmail(prisma, 'cloud.lead@example.com')
  const rohan = await getUserByEmail(prisma, 'pm.coach@example.com')
  const sneha = await getUserByEmail(prisma, 'data.trainer@example.com')
  const neha = await getUserByEmail(prisma, 'neha.sharma@example.com')
  const ankit = await getUserByEmail(prisma, 'ankit.verma@example.com')

  const cloudCat = await getCategoryId(prisma, 'cloud-computing')
  const pmCat = await getCategoryId(prisma, 'project-management')
  const dataCat = await getCategoryId(prisma, 'data-analytics')

  const awsCourse = await prisma.course.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      categoryId: cloudCat,
      slug: 'aws-solutions-architect',
      title: 'AWS Solutions Architect Associate',
      subtitle: 'SAA-C03 certification prep with live coaching',
      description: 'Master AWS architecture patterns and pass the SAA exam.',
      level: 'Intermediate',
      durationHours: 8,
      priceCents: 2499900,
      status: CourseStatus.published,
      coachingIncluded: true,
      ratingAvg: 4.9,
      reviewCount: 128,
      featured: true,
      trending: true,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Cloud Foundations',
            sortOrder: 1,
            lessons: {
              create: [
                { title: 'AWS Global Infrastructure', type: 'video', durationMinutes: 45, sortOrder: 1 },
                { title: 'IAM Deep Dive', type: 'video', durationMinutes: 60, sortOrder: 2 },
              ],
            },
          },
          {
            title: 'Networking & Security',
            sortOrder: 2,
            lessons: {
              create: [
                { title: 'VPC Design Patterns', type: 'video', durationMinutes: 55, sortOrder: 1 },
                { title: 'VPC Architecture Assignment', type: 'assignment', sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  })

  const pmCourse = await prisma.course.create({
    data: {
      organizationId: org.id,
      instructorId: rohan.id,
      categoryId: pmCat,
      slug: 'it-project-management',
      title: 'IT Project Management Professional',
      subtitle: 'PMP-aligned program with agile sprints',
      level: 'Advanced',
      durationHours: 10,
      priceCents: 1899900,
      status: CourseStatus.published,
      coachingIncluded: true,
      ratingAvg: 4.8,
      reviewCount: 96,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Initiating & Planning',
            sortOrder: 1,
            lessons: {
              create: [{ title: 'Project Charter Workshop', type: 'live', durationMinutes: 90, sortOrder: 1 }],
            },
          },
        ],
      },
    },
  })

  const dataCourse = await prisma.course.create({
    data: {
      organizationId: org.id,
      instructorId: sneha.id,
      categoryId: dataCat,
      slug: 'data-analytics-pro',
      title: 'Data Analytics Pro',
      subtitle: 'SQL, Python, and dashboard mastery',
      level: 'Intermediate',
      durationHours: 12,
      priceCents: 1699900,
      status: CourseStatus.published,
      coachingIncluded: false,
      ratingAvg: 4.7,
      reviewCount: 74,
      isNew: true,
      publishedAt: new Date(),
    },
  })

  const awsBatch = await prisma.batch.create({
    data: {
      organizationId: org.id,
      courseId: awsCourse.id,
      instructorId: aanya.id,
      batchCode: 'AWS-JUN2026',
      name: 'AWS SAA — June 2026 Cohort',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-15'),
      schedule: 'Tue & Thu · 6:00–8:00 PM IST',
      maxCapacity: 30,
      status: BatchStatus.active,
      completionRate: 68,
      published: true,
      instructors: {
        create: { instructorId: aanya.id, role: 'lead', permissions: { manage: true } },
      },
    },
  })

  const nehaAws = await prisma.enrollment.create({
    data: {
      organizationId: org.id,
      studentId: neha.id,
      courseId: awsCourse.id,
      batchId: awsBatch.id,
      status: EnrollmentStatus.active,
      progressPct: 68,
      modulesCompleted: 7,
      hoursSpent: 42,
      lastAccessedAt: new Date(),
      milestones: {
        create: [
          { phase: 'Phase 1', title: 'Cloud Foundations', description: 'Core AWS services', status: 'completed', completedAt: new Date('2026-06-10') },
          { phase: 'Phase 2', title: 'Networking', description: 'VPC and security', status: 'in-progress' },
        ],
      },
    },
  })

  await prisma.batchEnrollment.create({
    data: {
      batchId: awsBatch.id,
      studentId: neha.id,
      enrollmentId: nehaAws.id,
      status: 'active',
    },
  })

  await prisma.enrollment.create({
    data: {
      organizationId: org.id,
      studentId: neha.id,
      courseId: pmCourse.id,
      status: EnrollmentStatus.active,
      progressPct: 45,
      modulesCompleted: 3,
      hoursSpent: 18,
      lastAccessedAt: new Date(Date.now() - 86_400_000),
    },
  })

  await prisma.enrollment.create({
    data: {
      organizationId: org.id,
      studentId: neha.id,
      courseId: dataCourse.id,
      status: EnrollmentStatus.active,
      progressPct: 30,
      modulesCompleted: 2,
      hoursSpent: 12,
      lastAccessedAt: new Date(Date.now() - 172_800_000),
    },
  })

  const ankitAws = await prisma.enrollment.create({
    data: {
      organizationId: org.id,
      studentId: ankit.id,
      courseId: awsCourse.id,
      batchId: awsBatch.id,
      status: EnrollmentStatus.active,
      progressPct: 82,
      modulesCompleted: 9,
      hoursSpent: 56,
      lastAccessedAt: new Date(),
    },
  })

  await prisma.batchEnrollment.create({
    data: {
      batchId: awsBatch.id,
      studentId: ankit.id,
      enrollmentId: ankitAws.id,
      status: 'active',
    },
  })

  await prisma.enrollment.create({
    data: {
      organizationId: org.id,
      studentId: ankit.id,
      courseId: pmCourse.id,
      status: EnrollmentStatus.active,
      progressPct: 55,
      modulesCompleted: 4,
      hoursSpent: 22,
      lastAccessedAt: new Date(),
    },
  })

  const vpcAssignment = await prisma.assignment.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      courseId: awsCourse.id,
      title: 'VPC Architecture Design Document',
      type: 'project',
      dueAt: new Date('2026-06-27T23:59:59Z'),
      maxScore: 100,
      allowLate: false,
      status: AssignmentStatus.published,
    },
  })

  const iamAssignment = await prisma.assignment.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      courseId: awsCourse.id,
      title: 'IAM Policy Reflection',
      type: 'reflection',
      dueAt: new Date('2026-06-20T23:59:59Z'),
      maxScore: 100,
      allowLate: true,
      status: AssignmentStatus.published,
    },
  })

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: iamAssignment.id,
      enrollmentId: nehaAws.id,
      status: 'submitted',
      submittedAt: new Date('2026-06-18'),
    },
  })

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: vpcAssignment.id,
      enrollmentId: ankitAws.id,
      status: 'graded',
      score: 92,
      submittedAt: new Date('2026-06-22'),
      gradedAt: new Date('2026-06-23'),
    },
  })

  const moduleQuiz = await prisma.quiz.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      courseId: awsCourse.id,
      title: 'Module 2 Knowledge Check',
      durationMinutes: 30,
      maxAttempts: 2,
      passScore: 70,
      status: QuizStatus.published,
    },
  })

  await prisma.quiz.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      courseId: awsCourse.id,
      title: 'AWS SAA Practice Exam — Set 1',
      durationMinutes: 90,
      maxAttempts: 3,
      passScore: 72,
      status: QuizStatus.published,
    },
  })

  await prisma.quizAttempt.create({
    data: {
      quizId: moduleQuiz.id,
      enrollmentId: nehaAws.id,
      attemptNumber: 1,
      score: 85,
      maxScore: 100,
      percentage: 85,
      passed: true,
      status: 'graded',
      timeTakenSeconds: 1200,
      submittedAt: new Date('2026-06-15'),
    },
  })

  const qbItem = await prisma.question.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      createdById: aanya.id,
      updatedById: aanya.id,
      questionText: 'Which AWS service provides a managed relational database?',
      type: 'multiple_choice',
      category: 'AWS Core',
      difficulty: 'easy',
      marks: 1,
      tags: ['RDS', 'Database'],
      options: { choices: ['RDS', 'S3', 'EC2', 'Lambda'] },
      correctAnswer: { answer: 'RDS' },
    },
  })

  await prisma.quizQuestion.create({
    data: { quizId: moduleQuiz.id, questionId: qbItem.id, sortOrder: 1 },
  })

  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      courseId: awsCourse.id,
      title: 'Module 3 live session this Thursday',
      body: 'Join us for a deep dive on EC2 auto scaling and load balancing.',
      audience: 'course',
      status: 'sent',
      publishedAt: new Date(),
    },
  })

  const coachingSoon = new Date()
  coachingSoon.setDate(coachingSoon.getDate() + 3)
  coachingSoon.setHours(18, 0, 0, 0)

  await prisma.coachingSession.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      enrollmentId: nehaAws.id,
      title: '1:1 Architecture Review',
      startsAt: coachingSoon,
      durationMinutes: 45,
      type: '1:1',
      status: CoachingSessionStatus.scheduled,
      meetingUrl: 'https://meet.example.com/aws-review',
    },
  })

  await prisma.coachingSession.create({
    data: {
      organizationId: org.id,
      instructorId: aanya.id,
      enrollmentId: ankitAws.id,
      title: 'Mock Exam Debrief',
      startsAt: new Date(Date.now() - 7 * 86_400_000),
      durationMinutes: 30,
      type: '1:1',
      status: CoachingSessionStatus.completed,
    },
  })

  const notify = async (userId: string, type: NotificationType, title: string, body: string, read = false) =>
    prisma.notification.create({
      data: {
        userId,
        organizationId: org.id,
        type,
        title,
        body,
        readAt: read ? new Date() : null,
      },
    })

  await notify(neha.id, NotificationType.assignment, 'Assignment due soon', 'VPC Architecture Design Document is due Jun 27.')
  await notify(neha.id, NotificationType.coaching, 'Coaching session scheduled', 'Your 1:1 architecture review is coming up.', false)
  await notify(neha.id, NotificationType.grade, 'Assignment graded', 'Your IAM Policy Reflection received feedback.', true)
  await notify(aanya.id, NotificationType.enrollment, 'New enrollment', 'Ankit Verma enrolled in AWS Solutions Architect.')
  await notify(aanya.id, NotificationType.assignment, 'New submission', 'VPC Architecture Design Document submitted by Ankit Verma.')

  await prisma.calendarEvent.create({
    data: {
      organizationId: org.id,
      userId: neha.id,
      title: 'AWS Live Lab — EC2',
      startsAt: coachingSoon,
      endsAt: new Date(coachingSoon.getTime() + 3_600_000),
      type: 'live',
      courseId: awsCourse.id,
    },
  })

  await prisma.calendarEvent.create({
    data: {
      organizationId: org.id,
      userId: aanya.id,
      title: 'Office Hours',
      startsAt: coachingSoon,
      endsAt: new Date(coachingSoon.getTime() + 3_600_000),
      type: 'session',
    },
  })

  console.log('Workspace seed complete (courses, enrollments, assessments).')
  console.log(`Demo login password for all users: ${DEMO_PASSWORD}`)
}
