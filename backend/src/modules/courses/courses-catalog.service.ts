import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.module'
import { mapCatalogCourse, courseCatalogInclude } from './course.mapper'
import { CourseCatalogQueryDto } from '../../common/dto/course.dto'
import { buildPaginatedMeta, paginationArgs } from '../../common/dto/pagination.dto'
import { CourseStatus, CourseVisibility, Prisma } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class CoursesCatalogService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  async listCatalog(query: CourseCatalogQueryDto) {
    const orgId = await this.defaultOrgId()
    const { skip, take, page, pageSize } = paginationArgs(query.page, query.pageSize)

    const where: Prisma.CourseWhereInput = {
      organizationId: orgId,
      status: CourseStatus.published,
      visibility: CourseVisibility.public,
    }

    if (query.category) {
      where.category = { slug: query.category }
    }

    if (query.instructorId) {
      where.instructorId = query.instructorId
    }

    if (query.level) {
      where.level = { equals: query.level, mode: 'insensitive' }
    }

    if (query.featured === true) where.featured = true
    if (query.trending === true) where.trending = true
    if (query.forTeams === true) where.forTeams = true

    if (query.q?.trim()) {
      const q = query.q.trim()
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const orderBy = this.resolveSort(query.sort, query.q)

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        include: courseCatalogInclude,
        orderBy,
        skip,
        take,
      }),
    ])

    return {
      data: rows.map(mapCatalogCourse),
      meta: buildPaginatedMeta(total, page, pageSize),
    }
  }

  private resolveSort(
    sort: CourseCatalogQueryDto['sort'],
    q?: string,
  ): Prisma.CourseOrderByWithRelationInput | Prisma.CourseOrderByWithRelationInput[] {
    switch (sort) {
      case 'rating':
        return [{ ratingAvg: 'desc' }, { reviewCount: 'desc' }]
      case 'newest':
        return { publishedAt: 'desc' }
      case 'title':
        return { title: 'asc' }
      case 'duration':
        return [{ durationHours: 'asc' }, { title: 'asc' }]
      case 'relevance':
      default:
        if (q?.trim()) return { publishedAt: 'desc' }
        return [{ featured: 'desc' }, { publishedAt: 'desc' }]
    }
  }
}
