import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import { BRAND, resolveBrandLogoUrl } from '../../config/branding.constants'
import { escapeHtml, formatExpiryLabel } from './mail.utils'

export interface EmailLayoutOptions {
  preheader: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}

@Injectable()
export class TemplateService {
  private readonly appName: string
  private readonly logoUrl: string | null

  constructor(private config: ConfigService) {
    this.appName = this.config.get<string>('APP_NAME') ?? BRAND.name
    const appUrl = this.config.get<string>('APP_URL') ?? ''
    const explicitLogo = this.config.get<string>('APP_LOGO_URL')
    this.logoUrl = resolveBrandLogoUrl(appUrl, explicitLogo)
  }

  renderLayout(options: EmailLayoutOptions): string {
    const title = escapeHtml(options.title)
    const preheader = escapeHtml(options.preheader)
    const footerNote = escapeHtml(
      options.footerNote ?? 'If you did not request this email, you can safely ignore it.',
    )

    const logoBlock = this.logoUrl
      ? `<img src="${escapeHtml(this.logoUrl)}" alt="${escapeHtml(this.appName)}" width="140" height="40" style="display:block;border:0;max-width:140px;height:auto;" />`
      : `<p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(this.appName)}</p>
         <p style="margin:4px 0 0;font-size:12px;color:#d1dcef;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(BRAND.tagline)}</p>`

    const ctaBlock =
      options.ctaLabel && options.ctaUrl
        ? `<p style="margin:28px 0 0;text-align:center;">
            <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;background:${BRAND.primaryColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">${escapeHtml(options.ctaLabel)}</a>
          </p>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.primaryColor};padding:24px 32px;">${logoBlock}</td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1c1917;">${title}</h1>
              ${options.bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafaf9;border-top:1px solid #e7e5e4;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#78716c;">${footerNote}</p>
              <p style="margin:12px 0 0;font-size:12px;color:#a8a29e;">${escapeHtml(this.appName)} · <a href="${escapeHtml(BRAND.websiteUrl)}" style="color:#78716c;text-decoration:none;">sgprogrowth.com</a> · ${escapeHtml(BRAND.contactEmail)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  verificationEmail(name: string, verifyUrl: string, expiresHours: number): string {
    const safeName = escapeHtml(name)
    const expiry = formatExpiryLabel(expiresHours)
    return this.renderLayout({
      preheader: 'Verify your email to activate your account.',
      title: 'Verify your email address',
      bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#44403c;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#44403c;">Thanks for joining ${escapeHtml(this.appName)}. Please confirm your email address to activate your account and sign in.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#78716c;">This link expires in ${escapeHtml(expiry)}.</p>`,
      ctaLabel: 'Verify email address',
      ctaUrl: verifyUrl,
      footerNote: 'For your security, never share this verification link with anyone.',
    })
  }

  welcomeEmail(name: string, loginUrl: string): string {
    const safeName = escapeHtml(name)
    return this.renderLayout({
      preheader: 'Your account is ready.',
      title: `Welcome to ${this.appName}`,
      bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#44403c;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#44403c;">Your email is verified and your account is active. You can now sign in and access your dashboard.</p>`,
      ctaLabel: 'Sign in to your account',
      ctaUrl: loginUrl,
      footerNote: BRAND.tagline,
    })
  }

  passwordResetEmail(name: string, resetUrl: string, expiresHours: number): string {
    const safeName = escapeHtml(name)
    const expiry = formatExpiryLabel(expiresHours)
    return this.renderLayout({
      preheader: 'Reset your password.',
      title: 'Reset your password',
      bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#44403c;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#44403c;">We received a request to reset your password. Click the button below to choose a new password.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#78716c;">This link expires in ${escapeHtml(expiry)}. If you did not request a reset, no action is needed.</p>`,
      ctaLabel: 'Reset password',
      ctaUrl: resetUrl,
      footerNote: 'For your security, never share this reset link with anyone.',
    })
  }

  notificationEmail(title: string, message: string, actionUrl?: string, actionLabel = 'View in dashboard'): string {
    return this.renderLayout({
      preheader: title,
      title: escapeHtml(title),
      bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.6;color:#44403c;">${escapeHtml(message)}</p>`,
      ctaLabel: actionUrl ? actionLabel : undefined,
      ctaUrl: actionUrl,
    })
  }

  enrollmentConfirmationEmail(
    name: string,
    courseTitle: string,
    dashboardUrl: string,
  ): string {
    return this.notificationEmail(
      'Enrollment confirmed',
      `Hi ${name}, you are now enrolled in "${courseTitle}". Open your dashboard to start learning.`,
      dashboardUrl,
      'Go to my courses',
    )
  }

  coursePublishedEmail(instructorName: string, courseTitle: string, catalogUrl: string): string {
    return this.notificationEmail(
      'Course published',
      `Hi ${instructorName}, "${courseTitle}" is now live in the catalog and open for enrollments.`,
      catalogUrl,
      'View in catalog',
    )
  }

  assignmentNotificationEmail(
    name: string,
    assignmentTitle: string,
    courseTitle: string,
    dueLabel: string,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      'New assignment',
      `Hi ${name}, "${assignmentTitle}" in ${courseTitle} is due ${dueLabel}.`,
      actionUrl,
      'View assignment',
    )
  }

  assignmentPublishedEmail(
    name: string,
    assignmentTitle: string,
    courseTitle: string,
    dueLabel: string,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      'Assignment published',
      `Hi ${name}, a new assignment "${assignmentTitle}" is available in ${courseTitle}. Due ${dueLabel}.`,
      actionUrl,
      'View assignment',
    )
  }

  assignmentSubmittedEmail(
    instructorName: string,
    studentName: string,
    assignmentTitle: string,
    courseTitle: string,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      'New submission',
      `Hi ${instructorName}, ${studentName} submitted "${assignmentTitle}" in ${courseTitle}.`,
      actionUrl,
      'Review submission',
    )
  }

  assignmentGradedEmail(
    name: string,
    assignmentTitle: string,
    courseTitle: string,
    score: number,
    maxScore: number,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      'Assignment graded',
      `Hi ${name}, your submission for "${assignmentTitle}" in ${courseTitle} received ${score}/${maxScore}.`,
      actionUrl,
      'View feedback',
    )
  }

  assignmentReturnedEmail(
    name: string,
    assignmentTitle: string,
    courseTitle: string,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      'Revision requested',
      `Hi ${name}, your instructor returned "${assignmentTitle}" in ${courseTitle} for revision.`,
      actionUrl,
      'Resubmit assignment',
    )
  }

  quizNotificationEmail(name: string, quizTitle: string, courseTitle: string, actionUrl: string): string {
    return this.notificationEmail(
      'Quiz available',
      `Hi ${name}, "${quizTitle}" is now available in ${courseTitle}.`,
      actionUrl,
      'Take quiz',
    )
  }

  coachingReminderEmail(
    name: string,
    sessionTitle: string,
    whenLabel: string,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      'Coaching session reminder',
      `Hi ${name}, your session "${sessionTitle}" is scheduled for ${whenLabel}.`,
      actionUrl,
      'View session',
    )
  }

  calendarReminderEmail(name: string, eventTitle: string, whenLabel: string, actionUrl: string): string {
    return this.notificationEmail(
      'Calendar reminder',
      `Hi ${name}, "${eventTitle}" is coming up on ${whenLabel}.`,
      actionUrl,
      'View calendar',
    )
  }

  instructorAnnouncementEmail(
    name: string,
    announcementTitle: string,
    courseTitle: string,
    preview: string,
    actionUrl: string,
  ): string {
    return this.notificationEmail(
      announcementTitle,
      `Hi ${name}, ${courseTitle}: ${preview}`,
      actionUrl,
      'Read announcement',
    )
  }

  systemAnnouncementEmail(name: string, title: string, message: string, actionUrl?: string): string {
    return this.notificationEmail(title, `Hi ${name}, ${message}`, actionUrl)
  }

  roleLoginPath(role: UserRole): string {
    return role === UserRole.instructor ? '/login/instructor' : '/login/student'
  }
}
