import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { DirectMailQueueService } from '../mail/direct-mail-queue.service'
import { TemplateService } from '../mail/template.service'
import { MailService } from '../mail/mail.service'
import { PrismaService } from '../../prisma/prisma.module'

@Injectable()
export class AuthMailService {
  constructor(
    private prisma: PrismaService,
    private queue: DirectMailQueueService,
    private templates: TemplateService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  createToken(): string {
    return randomBytes(32).toString('base64url')
  }

  async sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
    const token = this.createToken()
    const hours = Number(this.config.get<string>('EMAIL_VERIFICATION_EXPIRES_HOURS') ?? 24)
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    })

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    })

    const verifyUrl = `${this.mail.getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`
    await this.queue.enqueue({
      to: email,
      subject: `Verify your ${this.mail.getAppName()} account`,
      html: this.templates.verificationEmail(name, verifyUrl, hours),
      text: `Verify your email: ${verifyUrl}`,
    })
  }

  async sendWelcomeEmail(email: string, name: string, role: UserRole): Promise<void> {
    const loginUrl = `${this.mail.getAppUrl()}${this.templates.roleLoginPath(role)}`
    await this.queue.enqueue({
      to: email,
      subject: `Welcome to ${this.mail.getAppName()}`,
      html: this.templates.welcomeEmail(name, loginUrl),
      text: `Welcome! Sign in at ${loginUrl}`,
    })
  }

  async sendPasswordResetEmail(userId: string, email: string, name: string): Promise<void> {
    const token = this.createToken()
    const hours = Number(this.config.get<string>('PASSWORD_RESET_EXPIRES_HOURS') ?? 1)
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    })

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    })

    const resetUrl = `${this.mail.getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`
    await this.queue.enqueue({
      to: email,
      subject: `Reset your ${this.mail.getAppName()} password`,
      html: this.templates.passwordResetEmail(name, resetUrl, hours),
      text: `Reset your password: ${resetUrl}`,
    })
  }
}
