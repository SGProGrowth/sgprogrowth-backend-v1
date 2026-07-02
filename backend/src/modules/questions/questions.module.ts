import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { StorageModule } from '../storage/storage.module'
import { QuestionsImportExportService } from './questions-import-export.service'
import { QuestionsController } from './questions.controller'
import { QuestionsService } from './questions.service'

@Module({
  imports: [MailModule, StorageModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsImportExportService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
