import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { EnrollCourseDto } from '../../common/dto/course.dto'
import { PaginationQueryDto } from '../../common/dto/pagination.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { EnrollmentsService } from './enrollments.service'

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Enroll the authenticated student in a published course' })
  enroll(@CurrentUser() user: JwtPayload, @Body() dto: EnrollCourseDto) {
    return this.enrollmentsService.enrollStudent(user.sub, dto)
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'List enrolled courses for the authenticated student' })
  listMine(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.enrollmentsService.listMyEnrollments(user.sub, query)
  }

  @Get('courses/:courseSlug/progress')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Progress summary for an enrolled course' })
  progress(@CurrentUser() user: JwtPayload, @Param('courseSlug') courseSlug: string) {
    return this.enrollmentsService.getProgress(user.sub, courseSlug)
  }
}

@ApiTags('courses')
@Controller('courses')
export class CourseEnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Get(':slug/enrollments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'List students enrolled in an instructor-owned course' })
  listForCourse(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.enrollmentsService.listCourseEnrollments(user.sub, slug, query)
  }
}
