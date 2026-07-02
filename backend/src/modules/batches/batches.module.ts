import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { BatchImportService } from './batch-import.service'
import { BatchesController } from './batches.controller'
import { BatchesService } from './batches.service'

@Module({
  imports: [MailModule],
  controllers: [BatchesController],
  providers: [BatchesService, BatchImportService],
  exports: [BatchesService, BatchImportService],
})
export class BatchesModule {}
