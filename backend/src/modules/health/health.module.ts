import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { StorageModule } from '../storage/storage.module'
import { HealthController } from './health.controller'

@Module({
  imports: [StorageModule, MailModule],
  controllers: [HealthController],
})
export class HealthModule {}
