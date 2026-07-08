import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { UpdateInstructorProfileDto } from '../../common/dto/profile.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { InstructorsService } from './instructors.service'

@ApiTags('instructors')
@ApiBearerAuth()
@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.instructor)
export class InstructorsController {
  constructor(private instructorsService: InstructorsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Instructor dashboard workspace bootstrap' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.instructorsService.getWorkspace(user.sub)
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update instructor profile' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateInstructorProfileDto) {
    return this.instructorsService.updateProfile(user.sub, dto)
  }

  @Patch('me/notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markNotificationRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.instructorsService.markNotificationRead(user.sub, id)
  }

  @Post('me/notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllNotificationsRead(@CurrentUser() user: JwtPayload) {
    return this.instructorsService.markAllNotificationsRead(user.sub)
  }
}
