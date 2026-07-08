import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { StorageModule } from '../storage/storage.module'
import { CertificatePdfService } from './certificate-pdf.service'
import { CertificateRulesService } from './certificate-rules.service'
import { CertificateTemplatesService } from './certificate-templates.service'
import { CertificateVerifyController, CertificatesController } from './certificates.controller'
import { CertificatesService } from './certificates.service'

@Module({
  imports: [MailModule, StorageModule],
  controllers: [CertificatesController, CertificateVerifyController],
  providers: [
    CertificatesService,
    CertificatePdfService,
    CertificateRulesService,
    CertificateTemplatesService,
  ],
  exports: [
    CertificatesService,
    CertificateRulesService,
    CertificatePdfService,
    CertificateTemplatesService,
  ],
})
export class CertificatesModule {}
