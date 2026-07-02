import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DirectMailQueueService } from './direct-mail-queue.service'
import { MailService } from './mail.service'
import { NotificationMailService } from './notification-mail.service'
import { TemplateService } from './template.service'
import { MAIL_QUEUE } from './mail-queue.interface'
import { BullMailQueueService } from '../../queue/bull-mail-queue.service'
import { QueueModule } from '../../queue/queue.module'

@Module({
  imports: [QueueModule],
  providers: [
    MailService,
    DirectMailQueueService,
    TemplateService,
    NotificationMailService,
    {
      provide: MAIL_QUEUE,
      inject: [ConfigService, DirectMailQueueService, BullMailQueueService],
      useFactory: (
        config: ConfigService,
        direct: DirectMailQueueService,
        bull: BullMailQueueService,
      ) => {
        const queueEnabled = config.get<string>('MAIL_QUEUE_ENABLED') === 'true'
        const redisUrl = config.get<string>('REDIS_URL')
        return queueEnabled && redisUrl ? bull : direct
      },
    },
  ],
  exports: [MailService, TemplateService, NotificationMailService, MAIL_QUEUE, DirectMailQueueService],
})
export class MailModule {}
