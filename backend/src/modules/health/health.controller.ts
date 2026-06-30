import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../prisma/prisma.module'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok', timestamp: new Date().toISOString() }
  }
}
