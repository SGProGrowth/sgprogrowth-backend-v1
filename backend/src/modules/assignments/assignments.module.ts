import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { ProgressModule } from '../progress/progress.module'
import { StorageModule } from '../storage/storage.module'
import { AssignmentsController } from './assignments.controller'
import { AssignmentsService } from './assignments.service'

@Module({
  imports: [MailModule, StorageModule, ProgressModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
