import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import type { MailQueue } from './mail-queue.interface'
import { MailService, SendMailOptions } from './mail.service'

/**
 * Sends email immediately. When MAIL_QUEUE_ENABLED=true, logs queue intent
 * and still delivers synchronously until Redis/BullMQ worker is added.
 */
@Injectable()
export class DirectMailQueueService implements MailQueue {
  private readonly logger = new Logger(DirectMailQueueService.name)
  private readonly queueEnabled: boolean

  constructor(
    private mail: MailService,
    config: ConfigService,
  ) {
    this.queueEnabled = config.get<string>('MAIL_QUEUE_ENABLED') === 'true'
  }

  async enqueue(options: SendMailOptions): Promise<void> {
    const jobId = randomUUID()

    if (this.queueEnabled) {
      this.logger.debug(`Mail job ${jobId} queued (direct delivery until worker is configured)`)
    }

    try {
      await this.mail.sendImmediate(options)
    } catch (err) {
      this.logger.error(
        `Failed to deliver mail job ${jobId} to ${options.to}: ${err instanceof Error ? err.message : err}`,
      )
      throw err
    }
  }
}
