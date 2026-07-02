import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { UpdateLessonProgressDto } from '../../common/dto/progress.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { ProgressService } from './progress.service'

@ApiTags('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('me')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Student learning dashboard metrics' })
  getStudentDashboard(@CurrentUser() user: JwtPayload) {
    return this.progressService.getStudentDashboard(user.sub)
  }

  @Get('me/continue')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Continue learning recommendations' })
  async getContinueLearning(@CurrentUser() user: JwtPayload) {
    const dash = await this.progressService.getStudentDashboard(user.sub)
    return { items: dash.continueLearning }
  }

  @Get('courses/:courseSlug')
  @Roles(UserRole.student, UserRole.instructor)
  @ApiOperation({ summary: 'Detailed course progress with modules and lessons' })
  getCourseProgress(
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.activeRole === UserRole.instructor) {
      throw new BadRequestException('Use instructor student progress endpoint')
    }
    return this.progressService.getCourseProgress(user.sub, courseSlug)
  }

  @Get('lessons/:lessonId/courses/:courseSlug')
  @Roles(UserRole.student)
  getLessonProgress(
    @Param('lessonId') lessonId: string,
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getLessonProgress(user.sub, lessonId, courseSlug)
  }

  @Post('lessons/:lessonId/courses/:courseSlug/complete')
  @Roles(UserRole.student)
  markComplete(
    @Param('lessonId') lessonId: string,
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.markLessonComplete(user.sub, lessonId, courseSlug)
  }

  @Post('lessons/:lessonId/courses/:courseSlug/incomplete')
  @Roles(UserRole.student)
  markIncomplete(
    @Param('lessonId') lessonId: string,
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.markLessonIncomplete(user.sub, lessonId, courseSlug)
  }

  @Patch('lessons/:lessonId/courses/:courseSlug')
  @Roles(UserRole.student)
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.progressService.updateLessonProgress(user.sub, lessonId, courseSlug, dto)
  }

  @Get('instructor/courses/:courseSlug/analytics')
  @Roles(UserRole.instructor)
  instructorAnalytics(
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getInstructorCourseAnalytics(user.sub, courseSlug)
  }

  @Get('instructor/courses/:courseSlug/students/:studentId')
  @Roles(UserRole.instructor)
  instructorStudentProgress(
    @Param('courseSlug') courseSlug: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.getInstructorStudentProgress(user.sub, courseSlug, studentId)
  }
}
