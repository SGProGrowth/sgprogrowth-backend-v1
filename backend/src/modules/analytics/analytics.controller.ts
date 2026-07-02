import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import type { Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import {
  AnalyticsFilterDto,
  ReportFormat,
  ReportQueryDto,
  ReportType,
} from '../../common/dto/analytics.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { AnalyticsService } from './analytics.service'
import { ReportsService } from './reports.service'

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private reportsService: ReportsService,
  ) {}

  @Get('analytics/student/me')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Full student analytics dashboard' })
  getStudentAnalytics(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getStudentAnalytics(user.sub)
  }

  @Get('analytics/student/widgets')
  @Roles(UserRole.student)
  getStudentWidgets(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getStudentWidgets(user.sub)
  }

  @Get('analytics/student/courses/:courseSlug/time')
  @Roles(UserRole.student)
  getStudentCourseTime(
    @CurrentUser() user: JwtPayload,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.analyticsService.getStudentCourseTime(user.sub, courseSlug)
  }

  @Get('analytics/instructor/me')
  @Roles(UserRole.instructor)
  getInstructorAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() filter: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getInstructorAnalytics(user.sub, filter)
  }

  @Get('analytics/instructor/widgets')
  @Roles(UserRole.instructor)
  getInstructorWidgets(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getInstructorWidgets(user.sub)
  }

  @Get('analytics/instructor/heatmap')
  @Roles(UserRole.instructor)
  getInstructorHeatmap(
    @CurrentUser() user: JwtPayload,
    @Query('courseSlug') courseSlug?: string,
  ) {
    return this.analyticsService.getInstructorHeatmap(user.sub, courseSlug)
  }

  @Get('analytics/admin/org')
  @Roles(UserRole.org_admin, UserRole.platform_admin)
  getAdminAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() filter: AnalyticsFilterDto,
  ) {
    this.analyticsService.assertAdminRole(user.roles)
    return this.analyticsService.getAdminOrgAnalytics(user.sub, user.organizationId, filter)
  }

  @Get('reports/:type')
  @Roles(UserRole.student, UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  async downloadReport(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const reportType = type as ReportType
    if (!Object.values(ReportType).includes(reportType)) {
      res.status(404).json({ message: 'Unknown report type' })
      return
    }

    const role =
      user.activeRole === UserRole.student
        ? 'student'
        : user.activeRole === UserRole.instructor
          ? 'instructor'
          : 'admin'

    const result = await this.reportsService.generate(
      reportType,
      query.format ?? ReportFormat.csv,
      { userId: user.sub, role, organizationId: user.organizationId },
      {
        courseSlug: query.courseSlug,
        batchId: query.batchId,
        from: query.from,
        to: query.to,
      },
    )

    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.buffer)
  }
}
