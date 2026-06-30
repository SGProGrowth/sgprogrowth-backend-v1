import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.module'

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async list() {
    const categories = await this.prisma.category.findMany({
      orderBy: { title: 'asc' },
      include: {
        _count: { select: { courses: { where: { status: 'published', visibility: 'public' } } } },
      },
    })

    return categories.map((cat) => ({
      id: cat.slug,
      title: cat.title,
      description: cat.description ?? '',
      courseCount: cat._count.courses,
      icon: (cat.icon ?? 'course') as 'project' | 'cloud' | 'data' | 'coaching' | 'software',
    }))
  }
}
