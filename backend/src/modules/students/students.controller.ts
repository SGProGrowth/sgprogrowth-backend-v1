import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { UpdateStudentProfileDto } from '../../common/dto/profile.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { StudentsService } from './students.service'

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.student)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Student dashboard workspace bootstrap' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.studentsService.getWorkspace(user.sub)
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update student profile and preferences' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateProfile(user.sub, dto)
  }

  @Patch('me/notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markNotificationRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.studentsService.markNotificationRead(user.sub, id)
  }

  @Post('me/notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllNotificationsRead(@CurrentUser() user: JwtPayload) {
    return this.studentsService.markAllNotificationsRead(user.sub)
  }
}
