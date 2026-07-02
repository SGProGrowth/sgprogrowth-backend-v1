import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { MailService, SendMailOptions } from '../../modules/mail/mail.service'
import { QUEUE_MAIL } from '../queue.constants'

@Processor(QUEUE_MAIL)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name)

  constructor(private mail: MailService) {
    super()
  }

  async process(job: Job<{ options: SendMailOptions }>): Promise<void> {
    const { options } = job.data
    try {
      await this.mail.sendImmediate(options)
      this.logger.debug(`Mail delivered to ${options.to} (job ${job.id})`)
    } catch (err) {
      this.logger.error(
        `Mail job ${job.id} failed for ${options.to}: ${err instanceof Error ? err.message : err}`,
      )
      throw err
    }
  }
}
