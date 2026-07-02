import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NotificationType, UserRole } from '@prisma/client'
import type { MailQueue } from './mail-queue.interface'
import { MAIL_QUEUE } from './mail-queue.interface'
import { TemplateService } from './template.service'
import { MailService } from './mail.service'
import { PrismaService } from '../../prisma/prisma.module'
import { stripHtml } from './mail.utils'

@Injectable()
export class NotificationMailService {
  private readonly logger = new Logger(NotificationMailService.name)
  private readonly enabled: boolean

  constructor(
    @Inject(MAIL_QUEUE) private queue: MailQueue,
    private templates: TemplateService,
    private mail: MailService,
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.enabled = config.get<string>('MAIL_NOTIFICATIONS_ENABLED') !== 'false'
  }

  private async deliver(
    to: string,
    subject: string,
    html: string,
    text: string,
    meta?: { userId?: string; organizationId?: string; type?: NotificationType; title?: string; body?: string; actionUrl?: string },
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`Notifications disabled — skipped: ${subject}`)
      return
    }

    if (meta?.userId && meta.type && meta.title && meta.body) {
      await this.prisma.notification.create({
        data: {
          userId: meta.userId,
          organizationId: meta.organizationId,
          type: meta.type,
          title: meta.title,
          body: meta.body,
          actionUrl: meta.actionUrl,
        },
      })
    }

    await this.queue.enqueue({ to, subject, html, text })
  }

  async sendEnrollmentConfirmation(input: {
    userId: string
    email: string
    name: string
    courseTitle: string
    courseSlug: string
    organizationId?: string
  }): Promise<void> {
    const dashboardUrl = `${this.mail.getAppUrl()}/dashboard/courses`
    const html = this.templates.enrollmentConfirmationEmail(input.name, input.courseTitle, dashboardUrl)

    await this.deliver(
      input.email,
      `Enrolled: ${input.courseTitle}`,
      html,
      `You are enrolled in ${input.courseTitle}. Visit: ${dashboardUrl}`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.enrollment,
        title: 'Enrollment confirmed',
        body: `You are now enrolled in ${input.courseTitle}.`,
        actionUrl: '/dashboard/courses',
      },
    ).catch((err) => this.logger.warn(`Enrollment email failed for ${input.email}: ${err}`))
  }

  async sendCoursePublished(input: {
    instructorId: string
    email: string
    name: string
    courseTitle: string
    courseSlug: string
    organizationId?: string
  }): Promise<void> {
    const catalogUrl = `${this.mail.getAppUrl()}/courses/${input.courseSlug}`
    const html = this.templates.coursePublishedEmail(input.name, input.courseTitle, catalogUrl)

    await this.deliver(
      input.email,
      `Course published: ${input.courseTitle}`,
      html,
      `"${input.courseTitle}" is now live. View: ${catalogUrl}`,
      {
        userId: input.instructorId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: 'Course published',
        body: `"${input.courseTitle}" is now live in the catalog.`,
        actionUrl: `/instructor/courses/${input.courseSlug}/edit`,
      },
    ).catch((err) => this.logger.warn(`Course published email failed for ${input.email}: ${err}`))
  }

  async sendAssignmentNotification(input: {
    userId: string
    email: string
    name: string
    assignmentTitle: string
    courseTitle: string
    dueLabel: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/assignments`
    const html = this.templates.assignmentNotificationEmail(
      input.name,
      input.assignmentTitle,
      input.courseTitle,
      input.dueLabel,
      actionUrl,
    )

    await this.deliver(
      input.email,
      `Assignment due: ${input.assignmentTitle}`,
      html,
      `${input.assignmentTitle} in ${input.courseTitle} is due ${input.dueLabel}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.assignment,
        title: 'Assignment update',
        body: `"${input.assignmentTitle}" in ${input.courseTitle} is due ${input.dueLabel}.`,
        actionUrl: '/dashboard/assignments',
      },
    ).catch((err) => this.logger.warn(`Assignment email failed for ${input.email}: ${err}`))
  }

  async sendAssignmentPublished(input: {
    userId: string
    email: string
    name: string
    assignmentTitle: string
    courseTitle: string
    dueLabel: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/assignments`
    const html = this.templates.assignmentPublishedEmail(
      input.name,
      input.assignmentTitle,
      input.courseTitle,
      input.dueLabel,
      actionUrl,
    )

    await this.deliver(
      input.email,
      `New assignment: ${input.assignmentTitle}`,
      html,
      `"${input.assignmentTitle}" in ${input.courseTitle} is due ${input.dueLabel}. View: ${actionUrl}`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.assignment,
        title: 'New assignment published',
        body: `"${input.assignmentTitle}" in ${input.courseTitle} is due ${input.dueLabel}.`,
        actionUrl: '/dashboard/assignments',
      },
    ).catch((err) => this.logger.warn(`Assignment published email failed for ${input.email}: ${err}`))
  }

  async sendAssignmentDueReminder(input: {
    userId: string
    email: string
    name: string
    assignmentTitle: string
    courseTitle: string
    dueLabel: string
    organizationId?: string
  }): Promise<void> {
    await this.sendAssignmentNotification(input)
  }

  async sendAssignmentSubmitted(input: {
    instructorId: string
    email: string
    name: string
    studentName: string
    assignmentTitle: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/instructor/assignments`
    const html = this.templates.assignmentSubmittedEmail(
      input.name,
      input.studentName,
      input.assignmentTitle,
      input.courseTitle,
      actionUrl,
    )

    await this.deliver(
      input.email,
      `Submission received: ${input.assignmentTitle}`,
      html,
      `${input.studentName} submitted "${input.assignmentTitle}" in ${input.courseTitle}.`,
      {
        userId: input.instructorId,
        organizationId: input.organizationId,
        type: NotificationType.assignment,
        title: 'New submission',
        body: `${input.studentName} submitted "${input.assignmentTitle}".`,
        actionUrl: '/instructor/assignments',
      },
    ).catch((err) => this.logger.warn(`Assignment submitted email failed for ${input.email}: ${err}`))
  }

  async sendAssignmentGraded(input: {
    userId: string
    email: string
    name: string
    assignmentTitle: string
    courseTitle: string
    score: number
    maxScore: number
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/assignments`
    const html = this.templates.assignmentGradedEmail(
      input.name,
      input.assignmentTitle,
      input.courseTitle,
      input.score,
      input.maxScore,
      actionUrl,
    )

    await this.deliver(
      input.email,
      `Graded: ${input.assignmentTitle}`,
      html,
      `Your submission for "${input.assignmentTitle}" was graded: ${input.score}/${input.maxScore}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.grade,
        title: 'Assignment graded',
        body: `"${input.assignmentTitle}" — ${input.score}/${input.maxScore}.`,
        actionUrl: '/dashboard/assignments',
      },
    ).catch((err) => this.logger.warn(`Assignment graded email failed for ${input.email}: ${err}`))
  }

  async sendAssignmentReturned(input: {
    userId: string
    email: string
    name: string
    assignmentTitle: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/assignments`
    const html = this.templates.assignmentReturnedEmail(
      input.name,
      input.assignmentTitle,
      input.courseTitle,
      actionUrl,
    )

    await this.deliver(
      input.email,
      `Revision requested: ${input.assignmentTitle}`,
      html,
      `Your instructor returned "${input.assignmentTitle}" for revision.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.assignment,
        title: 'Assignment returned',
        body: `"${input.assignmentTitle}" was returned for revision.`,
        actionUrl: '/dashboard/assignments',
      },
    ).catch((err) => this.logger.warn(`Assignment returned email failed for ${input.email}: ${err}`))
  }

  async sendQuizNotification(input: {
    userId: string
    email: string
    name: string
    quizTitle: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    return this.sendQuizPublished(input)
  }

  async sendQuizPublished(input: {
    userId: string
    email: string
    name: string
    quizTitle: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/quizzes`
    const html = this.templates.quizNotificationEmail(input.name, input.quizTitle, input.courseTitle, actionUrl)

    await this.deliver(
      input.email,
      `Quiz available: ${input.quizTitle}`,
      html,
      `"${input.quizTitle}" is available in ${input.courseTitle}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.quiz,
        title: 'Quiz available',
        body: `"${input.quizTitle}" is now available in ${input.courseTitle}.`,
        actionUrl: '/dashboard/quizzes',
      },
    ).catch((err) => this.logger.warn(`Quiz email failed for ${input.email}: ${err}`))
  }

  async sendQuizReminder(input: {
    userId: string
    email: string
    name: string
    quizTitle: string
    courseTitle: string
    dueLabel: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Quiz reminder: ${input.quizTitle}`,
      `<p>Hi ${input.name},</p><p>Reminder: "${input.quizTitle}" in ${input.courseTitle} is due ${input.dueLabel}.</p>`,
      `Reminder: "${input.quizTitle}" is due ${input.dueLabel}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.quiz,
        title: 'Quiz reminder',
        body: `"${input.quizTitle}" is due ${input.dueLabel}.`,
        actionUrl: '/dashboard/quizzes',
      },
    ).catch((err) => this.logger.warn(`Quiz reminder failed for ${input.email}: ${err}`))
  }

  async sendQuizSubmitted(input: {
    instructorId: string
    quizTitle: string
    studentName: string
    organizationId?: string
  }): Promise<void> {
    const instructor = await this.prisma.user.findUnique({
      where: { id: input.instructorId },
      include: { instructorProfile: true },
    })
    if (!instructor?.email) return

    await this.deliver(
      instructor.email,
      `Quiz submitted: ${input.quizTitle}`,
      `<p>${input.studentName} submitted "${input.quizTitle}".</p>`,
      `${input.studentName} submitted "${input.quizTitle}".`,
      {
        userId: input.instructorId,
        organizationId: input.organizationId,
        type: NotificationType.quiz,
        title: 'Quiz submitted',
        body: `${input.studentName} submitted "${input.quizTitle}".`,
        actionUrl: '/instructor/quizzes',
      },
    ).catch((err) => this.logger.warn(`Quiz submitted email failed: ${err}`))
  }

  async sendQuizGraded(input: {
    userId: string
    email: string
    name: string
    quizTitle: string
    score: number
    maxScore: number
    passed: boolean
    organizationId?: string
  }): Promise<void> {
    const label = input.passed ? 'Passed' : 'Review needed'
    await this.deliver(
      input.email,
      `Quiz graded: ${input.quizTitle}`,
      `<p>Hi ${input.name},</p><p>Your quiz "${input.quizTitle}" was graded: ${input.score}/${input.maxScore} (${label}).</p>`,
      `Your quiz "${input.quizTitle}" was graded: ${input.score}/${input.maxScore}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.grade,
        title: 'Quiz graded',
        body: `"${input.quizTitle}": ${input.score}/${input.maxScore} — ${label}.`,
        actionUrl: '/dashboard/quizzes',
      },
    ).catch((err) => this.logger.warn(`Quiz graded email failed for ${input.email}: ${err}`))
  }

  async sendLessonCompleted(input: {
    userId: string
    email: string
    name: string
    lessonTitle: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Lesson complete: ${input.lessonTitle}`,
      `<p>Hi ${input.name},</p><p>You completed "${input.lessonTitle}" in ${input.courseTitle}.</p>`,
      `You completed "${input.lessonTitle}" in ${input.courseTitle}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.progress,
        title: 'Lesson completed',
        body: `"${input.lessonTitle}" completed in ${input.courseTitle}.`,
        actionUrl: '/dashboard/progress',
      },
    ).catch((err) => this.logger.warn(`Lesson completed email failed for ${input.email}: ${err}`))
  }

  async sendModuleCompleted(input: {
    userId: string
    email: string
    name: string
    moduleTitle: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Module complete: ${input.moduleTitle}`,
      `<p>Hi ${input.name},</p><p>You finished module "${input.moduleTitle}" in ${input.courseTitle}.</p>`,
      `Module "${input.moduleTitle}" completed in ${input.courseTitle}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.progress,
        title: 'Module completed',
        body: `"${input.moduleTitle}" completed in ${input.courseTitle}.`,
        actionUrl: '/dashboard/progress',
      },
    ).catch((err) => this.logger.warn(`Module completed email failed for ${input.email}: ${err}`))
  }

  async sendCourseCompleted(input: {
    userId: string
    email: string
    name: string
    courseTitle: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Course complete: ${input.courseTitle}`,
      `<p>Congratulations ${input.name}! You completed "${input.courseTitle}".</p>`,
      `You completed "${input.courseTitle}".`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.progress,
        title: 'Course completed',
        body: `Congratulations! You completed "${input.courseTitle}".`,
        actionUrl: '/dashboard/certificates',
      },
    ).catch((err) => this.logger.warn(`Course completed email failed for ${input.email}: ${err}`))
  }

  async sendLearningStreakMilestone(input: {
    userId: string
    email: string
    name: string
    streakDays: number
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `${input.streakDays}-day learning streak!`,
      `<p>Hi ${input.name},</p><p>You're on a ${input.streakDays}-day learning streak. Keep it up!</p>`,
      `${input.streakDays}-day learning streak!`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.progress,
        title: 'Learning streak milestone',
        body: `${input.streakDays}-day learning streak — great work!`,
        actionUrl: '/dashboard/progress',
      },
    ).catch((err) => this.logger.warn(`Streak email failed for ${input.email}: ${err}`))
  }

  async sendCertificateIssued(input: {
    userId: string
    email: string
    name: string
    courseTitle: string
    credentialId: string
    verificationUrl: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Certificate issued: ${input.courseTitle}`,
      `<p>Congratulations ${input.name}!</p><p>Your certificate for "${input.courseTitle}" is ready.</p><p>Credential ID: ${input.credentialId}</p><p><a href="${input.verificationUrl}">Verify certificate</a></p>`,
      `Your certificate for "${input.courseTitle}" is ready. Verify at ${input.verificationUrl}`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.certificate,
        title: 'Certificate issued',
        body: `Your certificate for "${input.courseTitle}" has been issued.`,
        actionUrl: '/dashboard/certificates',
      },
    ).catch((err) => this.logger.warn(`Certificate issued email failed for ${input.email}: ${err}`))
  }

  async sendCertificateRevoked(input: {
    userId: string
    email: string
    name: string
    courseTitle: string
    reason: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Certificate revoked: ${input.courseTitle}`,
      `<p>Hi ${input.name},</p><p>Your certificate for "${input.courseTitle}" has been revoked.</p><p>Reason: ${input.reason}</p>`,
      `Your certificate for "${input.courseTitle}" was revoked. Reason: ${input.reason}`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.certificate,
        title: 'Certificate revoked',
        body: `Certificate for "${input.courseTitle}" was revoked.`,
        actionUrl: '/dashboard/certificates',
      },
    ).catch((err) => this.logger.warn(`Certificate revoked email failed for ${input.email}: ${err}`))
  }

  async sendCertificateReissued(input: {
    userId: string
    email: string
    name: string
    courseTitle: string
    credentialId: string
    verificationUrl: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Certificate reissued: ${input.courseTitle}`,
      `<p>Hi ${input.name},</p><p>A new certificate for "${input.courseTitle}" has been issued.</p><p>Credential ID: ${input.credentialId}</p>`,
      `A new certificate for "${input.courseTitle}" was issued.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.certificate,
        title: 'Certificate reissued',
        body: `A new certificate for "${input.courseTitle}" is available.`,
        actionUrl: '/dashboard/certificates',
      },
    ).catch((err) => this.logger.warn(`Certificate reissued email failed for ${input.email}: ${err}`))
  }

  async sendCoachingReminder(input: {
    userId: string
    email: string
    name: string
    sessionTitle: string
    whenLabel: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/coaching`
    const html = this.templates.coachingReminderEmail(input.name, input.sessionTitle, input.whenLabel, actionUrl)

    await this.deliver(
      input.email,
      `Coaching reminder: ${input.sessionTitle}`,
      html,
      `Your session "${input.sessionTitle}" is scheduled for ${input.whenLabel}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.coaching,
        title: 'Coaching session reminder',
        body: `"${input.sessionTitle}" is scheduled for ${input.whenLabel}.`,
        actionUrl: '/dashboard/coaching',
      },
    ).catch((err) => this.logger.warn(`Coaching reminder failed for ${input.email}: ${err}`))
  }

  async sendCalendarReminder(input: {
    userId: string
    email: string
    name: string
    eventTitle: string
    whenLabel: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/calendar`
    const html = this.templates.calendarReminderEmail(input.name, input.eventTitle, input.whenLabel, actionUrl)

    await this.deliver(
      input.email,
      `Reminder: ${input.eventTitle}`,
      html,
      `"${input.eventTitle}" is coming up on ${input.whenLabel}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: 'Calendar reminder',
        body: `"${input.eventTitle}" is coming up on ${input.whenLabel}.`,
        actionUrl: '/dashboard/calendar',
      },
    ).catch((err) => this.logger.warn(`Calendar reminder failed for ${input.email}: ${err}`))
  }

  async sendInstructorAnnouncement(input: {
    userId: string
    email: string
    name: string
    announcementTitle: string
    courseTitle: string
    preview: string
    organizationId?: string
  }): Promise<void> {
    const actionUrl = `${this.mail.getAppUrl()}/dashboard/notifications`
    const html = this.templates.instructorAnnouncementEmail(
      input.name,
      input.announcementTitle,
      input.courseTitle,
      input.preview,
      actionUrl,
    )

    await this.deliver(
      input.email,
      input.announcementTitle,
      html,
      `${input.courseTitle}: ${input.preview}`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.announcement,
        title: input.announcementTitle,
        body: `${input.courseTitle}: ${input.preview}`,
        actionUrl: '/dashboard/notifications',
      },
    ).catch((err) => this.logger.warn(`Announcement email failed for ${input.email}: ${err}`))
  }

  async sendSystemAnnouncement(input: {
    userId: string
    email: string
    name: string
    title: string
    message: string
    actionUrl?: string
    organizationId?: string
  }): Promise<void> {
    const fullActionUrl = input.actionUrl ? `${this.mail.getAppUrl()}${input.actionUrl}` : undefined
    const html = this.templates.systemAnnouncementEmail(input.name, input.title, input.message, fullActionUrl)

    await this.deliver(
      input.email,
      input.title,
      html,
      stripHtml(`${input.title}: ${input.message}`),
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: input.title,
        body: input.message,
        actionUrl: input.actionUrl,
      },
    ).catch((err) => this.logger.warn(`System announcement failed for ${input.email}: ${err}`))
  }

  async sendStudentAddedToBatch(input: {
    userId: string
    email: string
    name: string
    batchName: string
    courseTitle: string
    waitlisted?: boolean
    organizationId?: string
  }): Promise<void> {
    const statusNote = input.waitlisted ? ' (waitlisted — batch is at capacity)' : ''
    await this.deliver(
      input.email,
      `Enrolled in batch: ${input.batchName}`,
      `<p>Hi ${input.name},</p><p>You have been enrolled in batch "${input.batchName}" for ${input.courseTitle}${statusNote}.</p>`,
      `You have been enrolled in batch "${input.batchName}" for ${input.courseTitle}${statusNote}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.batch,
        title: 'Added to batch',
        body: `You were added to "${input.batchName}".`,
        actionUrl: '/dashboard/batches',
      },
    ).catch((err) => this.logger.warn(`Batch enrollment email failed for ${input.email}: ${err}`))
  }

  async sendBatchUpdated(input: {
    userId: string
    email: string
    name: string
    batchName: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Batch updated: ${input.batchName}`,
      `<p>Hi ${input.name},</p><p>Batch "${input.batchName}" has been updated.</p>`,
      `Batch "${input.batchName}" has been updated.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.batch,
        title: 'Batch updated',
        body: `"${input.batchName}" was updated.`,
        actionUrl: '/dashboard/batches',
      },
    ).catch((err) => this.logger.warn(`Batch updated email failed for ${input.email}: ${err}`))
  }

  async sendInstructorAssignedToBatch(input: {
    userId: string
    email: string
    name: string
    batchName: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Assigned to batch: ${input.batchName}`,
      `<p>Hi ${input.name},</p><p>You have been assigned to manage batch "${input.batchName}".</p>`,
      `You have been assigned to batch "${input.batchName}".`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.batch,
        title: 'Batch assignment',
        body: `You were assigned to "${input.batchName}".`,
        actionUrl: '/instructor/batches',
      },
    ).catch((err) => this.logger.warn(`Instructor batch assignment email failed for ${input.email}: ${err}`))
  }

  async sendBatchImportCompleted(input: {
    userId: string
    email: string
    name: string
    fileName: string
    successCount: number
    failureCount: number
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Import completed: ${input.fileName}`,
      `<p>Hi ${input.name},</p><p>Import "${input.fileName}" finished with ${input.successCount} success and ${input.failureCount} failed rows.</p>`,
      `Import "${input.fileName}": ${input.successCount} imported, ${input.failureCount} failed.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.batch,
        title: 'Bulk import completed',
        body: `${input.successCount} students imported, ${input.failureCount} failed.`,
        actionUrl: '/instructor/bulk-import',
      },
    ).catch((err) => this.logger.warn(`Batch import email failed for ${input.email}: ${err}`))
  }

  async sendStudentInvite(input: {
    email: string
    name: string
    batchName: string
    tempPassword?: string
    organizationId?: string
  }): Promise<void> {
    const loginUrl = `${this.mail.getAppUrl()}/login`
    const passwordNote = input.tempPassword
      ? `<p>Temporary password: <strong>${input.tempPassword}</strong></p>`
      : '<p>Use the link sent to your email to set your password.</p>'
    await this.deliver(
      input.email,
      `Welcome to ${input.batchName}`,
      `<p>Hi ${input.name},</p><p>Your student account has been created for batch "${input.batchName}".</p>${passwordNote}<p><a href="${loginUrl}">Sign in</a></p>`,
      `Welcome! Sign in at ${loginUrl}`,
      undefined,
    ).catch((err) => this.logger.warn(`Student invite email failed for ${input.email}: ${err}`))
  }

  async sendBatchEventReminder(input: {
    userId: string
    email: string
    name: string
    batchName: string
    eventTitle: string
    whenLabel: string
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `Upcoming: ${input.eventTitle}`,
      `<p>Hi ${input.name},</p><p>"${input.eventTitle}" for batch "${input.batchName}" is scheduled for ${input.whenLabel}.</p>`,
      `"${input.eventTitle}" for "${input.batchName}" is on ${input.whenLabel}.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.batch,
        title: 'Upcoming batch event',
        body: `"${input.eventTitle}" — ${input.whenLabel}.`,
        actionUrl: '/dashboard/batches',
      },
    ).catch((err) => this.logger.warn(`Batch event reminder failed for ${input.email}: ${err}`))
  }

  async sendWeeklyLearningSummary(input: {
    userId: string
    email: string
    name: string
    hoursThisWeek: number
    streak: number
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      'Your weekly learning summary',
      `<p>Hi ${input.name},</p><p>This week you logged ${input.hoursThisWeek} hours of learning. Current streak: ${input.streak} days.</p>`,
      `Weekly summary: ${input.hoursThisWeek}h learned, ${input.streak}-day streak.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: 'Weekly learning summary',
        body: `${input.hoursThisWeek}h this week · ${input.streak}-day streak`,
        actionUrl: '/dashboard/progress',
      },
    ).catch((err) => this.logger.warn(`Weekly summary failed for ${input.email}: ${err}`))
  }

  async sendMonthlyPerformanceSummary(input: {
    userId: string
    email: string
    name: string
    progressPct: number
    certificatesEarned: number
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      'Your monthly performance summary',
      `<p>Hi ${input.name},</p><p>Overall progress: ${input.progressPct}%. Certificates earned this month: ${input.certificatesEarned}.</p>`,
      `Monthly summary: ${input.progressPct}% progress, ${input.certificatesEarned} certificates.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: 'Monthly performance summary',
        body: `${input.progressPct}% overall progress`,
        actionUrl: '/dashboard/progress',
      },
    ).catch((err) => this.logger.warn(`Monthly summary failed for ${input.email}: ${err}`))
  }

  async sendStudentsFallingBehindAlert(input: {
    userId: string
    email: string
    name: string
    count: number
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      `${input.count} student(s) falling behind`,
      `<p>Hi ${input.name},</p><p>${input.count} enrolled student(s) are below 30% progress and may need support.</p>`,
      `${input.count} students are falling behind.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: 'Students at risk',
        body: `${input.count} student(s) below 30% progress`,
        actionUrl: '/instructor/analytics',
      },
    ).catch((err) => this.logger.warn(`At-risk alert failed for ${input.email}: ${err}`))
  }

  async sendInstructorEngagementSummary(input: {
    userId: string
    email: string
    name: string
    engagementRate: number
    activeStudents: number
    organizationId?: string
  }): Promise<void> {
    await this.deliver(
      input.email,
      'Instructor engagement summary',
      `<p>Hi ${input.name},</p><p>Engagement rate: ${input.engagementRate}%. Active students (7d): ${input.activeStudents}.</p>`,
      `Engagement: ${input.engagementRate}%, ${input.activeStudents} active students.`,
      {
        userId: input.userId,
        organizationId: input.organizationId,
        type: NotificationType.system,
        title: 'Engagement summary',
        body: `${input.engagementRate}% engagement · ${input.activeStudents} active`,
        actionUrl: '/instructor/analytics',
      },
    ).catch((err) => this.logger.warn(`Engagement summary failed for ${input.email}: ${err}`))
  }
}
