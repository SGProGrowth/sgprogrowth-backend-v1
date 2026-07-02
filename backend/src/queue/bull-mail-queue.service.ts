import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type { MailQueue } from '../modules/mail/mail-queue.interface'
import type { SendMailOptions } from '../modules/mail/mail.service'
import { QUEUE_MAIL } from './queue.constants'

@Injectable()
export class BullMailQueueService implements MailQueue {
  private readonly logger = new Logger(BullMailQueueService.name)

  constructor(@InjectQueue(QUEUE_MAIL) private mailQueue: Queue) {}

  async enqueue(options: SendMailOptions): Promise<void> {
    await this.mailQueue.add(
      'send',
      { options },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    )
    this.logger.debug(`Mail job queued for ${options.to}`)
  }
}
