import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type Transporter from 'nodemailer/lib/mailer'

export interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendMailResult {
  previewUrl?: string
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter | null = null
  private readonly enabled: boolean
  private readonly from: string
  private usingEthereal = false

  constructor(private config: ConfigService) {
    this.enabled = this.config.get<string>('MAIL_ENABLED') !== 'false'
    this.from = this.config.get<string>('SMTP_FROM') ?? 'SG Pro Growth <noreply@sgprogrowth.com>'
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Mail delivery disabled (MAIL_ENABLED=false)')
      return
    }

    await this.initTransporter()
  }

  private async initTransporter(): Promise<void> {
    const smtpUrl = this.config.get<string>('SMTP_URL')
    if (smtpUrl) {
      this.transporter = nodemailer.createTransport(smtpUrl)
      await this.verifyTransporter('SMTP_URL')
      return
    }

    const host = this.config.get<string>('SMTP_HOST')
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587)
    const secure = this.config.get<string>('SMTP_SECURE') === 'true'
    const user = this.config.get<string>('SMTP_USER')
    const pass = this.config.get<string>('SMTP_PASS')

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        requireTLS: !secure && port === 587,
        tls: { minVersion: 'TLSv1.2' },
      })
      await this.verifyTransporter(`${host}:${port}`)
      return
    }

    const useEthereal =
      this.config.get<string>('SMTP_USE_ETHEREAL') === 'true' &&
      this.config.get<string>('NODE_ENV') !== 'production'

    if (useEthereal) {
      try {
        const testAccount = await nodemailer.createTestAccount()
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        })
        this.usingEthereal = true
        this.logger.log(
          `SMTP using Ethereal test inbox (${testAccount.user}) — preview URLs logged after each send`,
        )
        return
      } catch (err) {
        this.logger.warn(
          `Ethereal SMTP setup failed: ${err instanceof Error ? err.message : err}`,
        )
      }
    }

    this.logger.warn(
      'SMTP not configured — set SMTP_HOST/SMTP_USER/SMTP_PASS or SMTP_URL (or SMTP_USE_ETHEREAL=true for local dev)',
    )
  }

  private async verifyTransporter(label: string): Promise<void> {
    if (!this.transporter) return
    try {
      await this.transporter.verify()
      this.logger.log(`SMTP connected (${label})`)
    } catch (err) {
      this.logger.warn(
        `SMTP verification failed (${label}) — delivery may fail: ${err instanceof Error ? err.message : err}`,
      )
    }
  }

  /** Low-level immediate send used by the mail queue adapter. */
  async sendImmediate(options: SendMailOptions): Promise<SendMailResult> {
    if (!this.enabled) {
      this.logger.log(`[MAIL DISABLED] To: ${options.to} | Subject: ${options.subject}`)
      return {}
    }

    if (!this.transporter) {
      throw new Error(
        'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS (or SMTP_URL) before sending mail.',
      )
    }

    const info = await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    const previewUrl = this.usingEthereal ? nodemailer.getTestMessageUrl(info) : undefined
    if (previewUrl) {
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`)
      this.logger.log(`Ethereal preview: ${previewUrl}`)
      return { previewUrl: previewUrl ?? undefined }
    }

    this.logger.log(`Email sent to ${options.to}: ${options.subject}`)
    return {}
  }

  getAppUrl(): string {
    return this.config.get<string>('APP_URL') ?? 'http://localhost:5173'
  }

  getAppName(): string {
    return this.config.get<string>('APP_NAME') ?? 'SG Pro Growth'
  }

  isConfigured(): boolean {
    return Boolean(this.transporter)
  }
}
