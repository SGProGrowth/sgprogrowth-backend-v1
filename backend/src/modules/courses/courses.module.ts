import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { CoursesCatalogService } from './courses-catalog.service'
import { CoursesController } from './courses.controller'
import { CoursesCurriculumService } from './courses-curriculum.service'
import { CoursesService } from './courses.service'

@Module({
  imports: [MailModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesCatalogService, CoursesCurriculumService],
  exports: [CoursesService, CoursesCatalogService],
})
export class CoursesModule {}
