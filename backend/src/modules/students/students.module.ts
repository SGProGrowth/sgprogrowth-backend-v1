import { Module } from '@nestjs/common'
import { ProgressModule } from '../progress/progress.module'
import { StudentsController } from './students.controller'
import { StudentsService } from './students.service'

@Module({
  imports: [ProgressModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
