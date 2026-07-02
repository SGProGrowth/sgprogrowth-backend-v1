import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { ProgressModule } from '../progress/progress.module'
import { QuizzesModule } from '../quizzes/quizzes.module'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'
import { ReportsService } from './reports.service'

@Module({
  imports: [ProgressModule, QuizzesModule, MailModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ReportsService],
  exports: [AnalyticsService, ReportsService],
})
export class AnalyticsModule {}
