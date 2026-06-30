import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.module'

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getDefaultOrganization() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const name = this.config.get<string>('DEFAULT_ORGANIZATION_NAME') ?? 'SG Pro Growth'

    return this.prisma.organization.upsert({
      where: { slug },
      update: {},
      create: { slug, name, settings: { timezone: 'Asia/Kolkata' } },
    })
  }
}
