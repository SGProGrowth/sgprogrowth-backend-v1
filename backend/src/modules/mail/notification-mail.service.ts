import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NotificationType, UserRole } from '@prisma/client'
import { DirectMailQueueService } from './direct-mail-queue.service'
import { TemplateService } from './template.service'
import { MailService } from './mail.service'
import { PrismaService } from '../../prisma/prisma.module'
import { stripHtml } from './mail.utils'

@Injectable()
export class NotificationMailService {
  private readonly logger = new Logger(NotificationMailService.name)
  private readonly enabled: boolean

  constructor(
    private queue: DirectMailQueueService,
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

  async sendQuizNotification(input: {
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
}
