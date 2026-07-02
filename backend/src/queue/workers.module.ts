import { Module } from '@nestjs/common'
import { MailModule } from '../modules/mail/mail.module'
import { StorageModule } from '../modules/storage/storage.module'
import { CertificatesModule } from '../modules/certificates/certificates.module'
import { BatchesModule } from '../modules/batches/batches.module'
import { AnalyticsModule } from '../modules/analytics/analytics.module'
import { PrismaModule } from '../prisma/prisma.module'
import { AppCacheModule } from '../cache/cache.module'
import { MailProcessor } from './processors/mail.processor'
import { CertificateProcessor } from './processors/certificate.processor'
import { BatchImportProcessor } from './processors/batch-import.processor'
import { AnalyticsProcessor } from './processors/analytics.processor'
import { NotificationsProcessor } from './processors/notifications.processor'
import { CleanupProcessor } from './processors/cleanup.processor'

@Module({
  imports: [
    PrismaModule,
    AppCacheModule,
    MailModule,
    StorageModule,
    CertificatesModule,
    BatchesModule,
    AnalyticsModule,
  ],
  providers: [
    MailProcessor,
    CertificateProcessor,
    BatchImportProcessor,
    AnalyticsProcessor,
    NotificationsProcessor,
    CleanupProcessor,
  ],
})
export class WorkersModule {}
