import { Module } from '@nestjs/common'
import { DirectMailQueueService } from './direct-mail-queue.service'
import { MailService } from './mail.service'
import { NotificationMailService } from './notification-mail.service'
import { TemplateService } from './template.service'

@Module({
  providers: [MailService, DirectMailQueueService, TemplateService, NotificationMailService],
  exports: [MailService, DirectMailQueueService, TemplateService, NotificationMailService],
})
export class MailModule {}
