import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { ProgressModule } from '../progress/progress.module'
import { QuizzesController } from './quizzes.controller'
import { QuizzesService } from './quizzes.service'

@Module({
  imports: [MailModule, ProgressModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
