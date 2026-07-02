import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { BatchImportService } from '../../modules/batches/batch-import.service'
import { QUEUE_BATCH_IMPORT } from '../queue.constants'

export type BatchImportJobData = {
  jobId: string
  instructorId: string
}

@Processor(QUEUE_BATCH_IMPORT)
export class BatchImportProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchImportProcessor.name)

  constructor(private batchImport: BatchImportService) {
    super()
  }

  async process(job: Job<BatchImportJobData>): Promise<void> {
    await this.batchImport.executeImportJob(job.data.jobId, job.data.instructorId)
    this.logger.log(`Batch import job ${job.data.jobId} completed`)
  }
}
