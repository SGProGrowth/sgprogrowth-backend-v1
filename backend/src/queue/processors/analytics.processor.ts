import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { AnalyticsService } from '../../modules/analytics/analytics.service'
import { CacheService } from '../../cache/cache.service'
import { QUEUE_ANALYTICS } from '../queue.constants'

export type AnalyticsJobData = {
  kind: 'instructor-widgets' | 'instructor-dashboard'
  instructorId: string
  filterKey: string
}

@Processor(QUEUE_ANALYTICS)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name)

  constructor(
    private analytics: AnalyticsService,
    private cache: CacheService,
  ) {
    super()
  }

  async process(job: Job<AnalyticsJobData>): Promise<void> {
    const { kind, instructorId, filterKey } = job.data
    const cacheKey = `analytics:${kind}:${instructorId}:${filterKey}`

    if (kind === 'instructor-widgets') {
      const data = await this.analytics.getInstructorWidgets(instructorId)
      await this.cache.set(cacheKey, data, 600)
    } else {
      const data = await this.analytics.getInstructorAnalytics(instructorId, {})
      await this.cache.set(cacheKey, data, 600)
    }
    this.logger.debug(`Analytics cache warmed: ${cacheKey}`)
  }
}
