import { Module } from '@nestjs/common'
import { AnalyticsModule } from '../analytics/analytics.module'
import { InstructorsController } from './instructors.controller'
import { InstructorsService } from './instructors.service'

@Module({
  imports: [AnalyticsModule],
  controllers: [InstructorsController],
  providers: [InstructorsService],
  exports: [InstructorsService],
})
export class InstructorsModule {}
