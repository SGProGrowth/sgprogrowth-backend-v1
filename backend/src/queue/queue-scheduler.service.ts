import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bullmq'
import {
  QUEUE_ANALYTICS,
  QUEUE_CLEANUP,
  QUEUE_CERTIFICATES,
  QUEUE_BATCH_IMPORT,
  QUEUE_MAIL,
} from './queue.constants'

@Injectable()
export class QueueSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(QueueSchedulerService.name)

  constructor(
    private config: ConfigService,
    @InjectQueue(QUEUE_CLEANUP) private cleanupQueue: Queue,
    @InjectQueue(QUEUE_MAIL) private mailQueue: Queue,
    @InjectQueue(QUEUE_CERTIFICATES) private certQueue: Queue,
    @InjectQueue(QUEUE_BATCH_IMPORT) private importQueue: Queue,
    @InjectQueue(QUEUE_ANALYTICS) private analyticsQueue: Queue,
  ) {}

  async onModuleInit() {
    if (this.config.get<string>('SCHEDULED_JOBS_ENABLED') !== 'true') return
    if (!this.config.get<string>('REDIS_URL')) return

    await this.cleanupQueue.add(
      'daily-cleanup',
      { kind: 'expired-tokens' },
      { repeat: { pattern: '0 3 * * *' }, jobId: 'cleanup-tokens-daily' },
    )
    await this.cleanupQueue.add(
      'weekly-orphans',
      { kind: 'orphan-media' },
      { repeat: { pattern: '0 4 * * 0' }, jobId: 'cleanup-orphans-weekly' },
    )
    this.logger.log('Scheduled cleanup jobs registered')
  }

  async getQueueStats() {
    const queues = [
      { name: QUEUE_MAIL, queue: this.mailQueue },
      { name: QUEUE_CERTIFICATES, queue: this.certQueue },
      { name: QUEUE_BATCH_IMPORT, queue: this.importQueue },
      { name: QUEUE_ANALYTICS, queue: this.analyticsQueue },
      { name: QUEUE_CLEANUP, queue: this.cleanupQueue },
    ]

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ])
        return { name, waiting, active, completed, failed, delayed }
      }),
    )
    return stats
  }

  async enqueueCertificatePdf(certificateId: string) {
    await this.certQueue.add(
      'generate-pdf',
      { certificateId },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    )
  }

  async enqueueBatchImport(jobId: string, instructorId: string) {
    await this.importQueue.add(
      'execute',
      { jobId, instructorId },
      { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
    )
  }

  async warmAnalyticsCache(instructorId: string, filterKey = 'default') {
    await this.analyticsQueue.add('warm-widgets', {
      kind: 'instructor-widgets',
      instructorId,
      filterKey,
    })
  }
}
