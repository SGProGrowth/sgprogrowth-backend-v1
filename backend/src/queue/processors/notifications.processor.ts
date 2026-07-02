import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NOTIFICATIONS } from '../queue.constants'

export type NotificationJobData = {
  type: string
  payload: Record<string, unknown>
}

/** Placeholder processor for scheduled notification digests. */
@Processor(QUEUE_NOTIFICATIONS)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name)

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.debug(`Notification job ${job.data.type} processed (job ${job.id})`)
  }
}
