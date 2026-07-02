import { Global, Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { ALL_QUEUES } from './queue.constants'
import { BullMailQueueService } from './bull-mail-queue.service'
import { QueueSchedulerService } from './queue-scheduler.service'

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        },
      }),
    }),
    BullModule.registerQueue(...ALL_QUEUES.map((name) => ({ name }))),
  ],
  providers: [BullMailQueueService, QueueSchedulerService],
  exports: [BullModule, BullMailQueueService, QueueSchedulerService],
})
export class QueueModule {}
