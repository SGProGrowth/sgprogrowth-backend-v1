import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { CourseEnrollmentsController, EnrollmentsController } from './enrollments.controller'
import { EnrollmentsService } from './enrollments.service'

@Module({
  imports: [MailModule],
  controllers: [EnrollmentsController, CourseEnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
