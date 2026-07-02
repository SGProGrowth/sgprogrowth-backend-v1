import { Module } from '@nestjs/common'
import { CertificatesModule } from '../certificates/certificates.module'
import { MailModule } from '../mail/mail.module'
import { ProgressController } from './progress.controller'
import { ProgressService } from './progress.service'

@Module({
  imports: [MailModule, CertificatesModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
