import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
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
}
