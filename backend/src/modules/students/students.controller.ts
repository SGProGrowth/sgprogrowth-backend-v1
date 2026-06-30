import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
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
}
