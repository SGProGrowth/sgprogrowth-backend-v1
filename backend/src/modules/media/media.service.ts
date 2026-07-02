import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MediaAssetType, MediaVisibility, Prisma, UserRole } from '@prisma/client'
import type { Express } from 'express'
import { MediaListQueryDto } from '../../common/dto/media.dto'
import { PrismaService } from '../../prisma/prisma.module'
import { StorageService } from '../storage/storage.service'
import { ImageProcessorService } from './image-processor.service'
import { validateMediaFile } from './media-validation'

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private storage: StorageService,
    private images: ImageProcessorService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private mediaUrl(id: string) {
    const apiPrefix = this.config.get<string>('API_PREFIX') ?? 'api/v1'
    const port = this.config.get<string>('PORT') ?? '3000'
    const base = this.config.get<string>('APP_URL') ?? `http://localhost:${port}`
    return `${base}/${apiPrefix}/media/${id}/download`
  }

  private mapAsset(asset: {
    id: string
    assetType: MediaAssetType
    visibility: MediaVisibility
    filename: string
    mimeType: string
    sizeBytes: number
    width: number | null
    height: number | null
    variants: unknown
    createdAt: Date
    courseId: string | null
    batchId: string | null
    lessonId: string | null
    ownerId: string
  }) {
    return {
      id: asset.id,
      assetType: asset.assetType,
      visibility: asset.visibility,
      filename: asset.filename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      variants: asset.variants,
      courseId: asset.courseId,
      batchId: asset.batchId,
      lessonId: asset.lessonId,
      ownerId: asset.ownerId,
      downloadUrl: this.mediaUrl(asset.id),
      createdAt: asset.createdAt.toISOString(),
    }
  }

  async upload(
    userId: string,
    role: UserRole,
    assetType: MediaAssetType,
    file: Express.Multer.File,
    opts?: {
      visibility?: MediaVisibility
      courseSlug?: string
      batchId?: string
      lessonId?: string
      replaceAssetId?: string
    },
  ) {
    if (!file) throw new BadRequestException('file required')
    validateMediaFile(file, assetType)

    const orgId = await this.defaultOrgId()
    let courseId: string | undefined
    let batchId = opts?.batchId

    if (opts?.courseSlug) {
      const course = await this.prisma.course.findUnique({
        where: { organizationId_slug: { organizationId: orgId, slug: opts.courseSlug } },
      })
      if (!course) throw new NotFoundException('Course not found')
      if (role === UserRole.instructor && course.instructorId !== userId) {
        throw new ForbiddenException('Course access denied')
      }
      courseId = course.id
    }

    if (batchId && role === UserRole.instructor) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
        include: { instructors: true },
      })
      if (!batch) throw new NotFoundException('Batch not found')
      const allowed =
        batch.instructorId === userId || batch.instructors.some((i) => i.instructorId === userId)
      if (!allowed) throw new ForbiddenException('Batch access denied')
    }

    if (opts?.lessonId && role === UserRole.instructor) {
      const lesson = await this.prisma.courseLesson.findUnique({
        where: { id: opts.lessonId },
        include: { module: { include: { course: true } } },
      })
      if (!lesson || lesson.module.course.instructorId !== userId) {
        throw new ForbiddenException('Lesson access denied')
      }
      courseId = lesson.module.courseId
    }

    if (opts?.replaceAssetId) {
      await this.softDelete(userId, role, opts.replaceAssetId)
    }

    const visibility =
      opts?.visibility ??
      (['course_thumbnail', 'course_banner', 'batch_thumbnail', 'batch_banner', 'avatar'].includes(assetType)
        ? MediaVisibility.public
        : MediaVisibility.private)

    const prefix = `media/${assetType}`
    const storageKey = this.storage.buildKey(prefix, file.originalname)
    await this.storage.saveBuffer(storageKey, file.buffer, {
      contentType: file.mimetype,
      visibility: visibility === MediaVisibility.public ? 'public' : 'private',
    })

    const processed = await this.images.processImage(prefix, file.originalname, file.buffer, file.mimetype)

    const asset = await this.prisma.mediaAsset.create({
      data: {
        organizationId: orgId,
        ownerId: userId,
        assetType,
        visibility,
        storageKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: processed.width || null,
        height: processed.height || null,
        variants: processed.variants as Prisma.InputJsonValue,
        courseId,
        batchId,
        lessonId: opts?.lessonId,
      },
    })

    await this.applyEntityBinding(userId, role, assetType, asset.id, {
      courseSlug: opts?.courseSlug,
      batchId,
      lessonId: opts?.lessonId,
    })

    return this.mapAsset(asset)
  }

  async uploadMany(
    userId: string,
    role: UserRole,
    assetType: MediaAssetType,
    files: Express.Multer.File[],
    opts?: Parameters<MediaService['upload']>[4],
  ) {
    const results = []
    for (const file of files) {
      results.push(await this.upload(userId, role, assetType, file, opts))
    }
    return results
  }

  private async applyEntityBinding(
    userId: string,
    role: UserRole,
    assetType: MediaAssetType,
    assetId: string,
    opts: { courseSlug?: string; batchId?: string; lessonId?: string },
  ) {
    const url = this.mediaUrl(assetId)

    if (assetType === MediaAssetType.avatar) {
      if (role === UserRole.student) {
        await this.prisma.studentProfile.update({
          where: { userId },
          data: { avatarUrl: url },
        })
      } else if (role === UserRole.instructor) {
        await this.prisma.instructorProfile.update({
          where: { userId },
          data: { avatarUrl: url },
        })
      }
    }

    if (opts.courseSlug) {
      const orgId = await this.defaultOrgId()
      if (assetType === MediaAssetType.course_thumbnail) {
        await this.prisma.course.update({
          where: { organizationId_slug: { organizationId: orgId, slug: opts.courseSlug } },
          data: { thumbnailUrl: url },
        })
      }
      if (assetType === MediaAssetType.course_banner) {
        await this.prisma.course.update({
          where: { organizationId_slug: { organizationId: orgId, slug: opts.courseSlug } },
          data: { bannerUrl: url },
        })
      }
    }

    if (opts.batchId) {
      if (assetType === MediaAssetType.batch_thumbnail) {
        await this.prisma.batch.update({ where: { id: opts.batchId }, data: { thumbnailUrl: url } })
      }
      if (assetType === MediaAssetType.batch_banner) {
        await this.prisma.batch.update({ where: { id: opts.batchId }, data: { bannerUrl: url } })
      }
    }

    if (opts.lessonId && assetType === MediaAssetType.lesson_resource) {
      const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } })
      if (asset) {
        await this.prisma.lessonAsset.create({
          data: {
            lessonId: opts.lessonId,
            assetType: asset.mimeType.startsWith('video/') ? 'video' : 'resource',
            storageKey: asset.storageKey,
            mimeType: asset.mimeType,
            sizeBytes: asset.sizeBytes,
          },
        })
      }
    }
  }

  async list(userId: string, role: UserRole, query: MediaListQueryDto) {
    const orgId = await this.defaultOrgId()
    const page = Math.max(1, Number(query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)))
    const skip = (page - 1) * pageSize

    const where: Prisma.MediaAssetWhereInput = {
      organizationId: orgId,
      deletedAt: null,
    }

    if (role === UserRole.student) where.ownerId = userId
    else if (role === UserRole.instructor) {
      where.OR = [{ ownerId: userId }, { course: { instructorId: userId } }]
    }

    if (query.type) where.assetType = query.type
    if (query.ownerId && role !== UserRole.student) where.ownerId = query.ownerId
    if (query.batchId) where.batchId = query.batchId
    if (query.courseId) where.courseId = query.courseId
    if (query.courseSlug) where.course = { slug: query.courseSlug, organizationId: orgId }
    if (query.search?.trim()) {
      where.filename = { contains: query.search.trim(), mode: 'insensitive' }
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.mediaAsset.count({ where }),
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ])

    return {
      items: rows.map((r) => this.mapAsset(r)),
      total,
      page,
      pageSize,
    }
  }

  async getStats(userId: string, role: UserRole) {
    const orgId = await this.defaultOrgId()
    const where: Prisma.MediaAssetWhereInput = { organizationId: orgId, deletedAt: null }
    if (role === UserRole.instructor) {
      where.OR = [{ ownerId: userId }, { course: { instructorId: userId } }]
    } else if (role === UserRole.student) {
      where.ownerId = userId
    }

    const assets = await this.prisma.mediaAsset.findMany({
      where,
      select: { sizeBytes: true, assetType: true, mimeType: true },
    })

    const byType: Record<string, { count: number; bytes: number }> = {}
    let totalBytes = 0
    for (const a of assets) {
      totalBytes += a.sizeBytes
      byType[a.assetType] = byType[a.assetType] ?? { count: 0, bytes: 0 }
      byType[a.assetType].count++
      byType[a.assetType].bytes += a.sizeBytes
    }

    return {
      totalFiles: assets.length,
      totalBytes,
      totalMb: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
      provider: this.storage.getProvider(),
      byType,
    }
  }

  async getSignedUrl(userId: string, role: UserRole, assetId: string, expiresIn?: number) {
    const asset = await this.getAuthorizedAsset(userId, role, assetId)
    const url = await this.storage.getSignedDownloadUrl(asset.storageKey, expiresIn)
    return { url, expiresIn: expiresIn ?? 3600, assetId: asset.id }
  }

  async openDownloadStream(userId: string, role: UserRole, assetId: string) {
    const asset = await this.getAuthorizedAsset(userId, role, assetId)
    return {
      stream: await this.storage.openReadStream(asset.storageKey),
      filename: asset.filename,
      mimeType: asset.mimeType,
    }
  }

  async softDelete(userId: string, role: UserRole, assetId: string) {
    const asset = await this.getAuthorizedAsset(userId, role, assetId, true)
    await this.prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { deletedAt: new Date() },
    })
    return { deleted: true }
  }

  async hardDelete(userId: string, role: UserRole, assetId: string) {
    const asset = await this.getAuthorizedAsset(userId, role, assetId, true)
    await this.storage.deleteObject(asset.storageKey)
    const variants = asset.variants as Record<string, { key?: string }>
    for (const v of Object.values(variants)) {
      if (v?.key) await this.storage.deleteObject(v.key)
    }
    await this.prisma.mediaAsset.delete({ where: { id: asset.id } })
    return { deleted: true }
  }

  async cleanupOrphans(userId: string, role: UserRole) {
    if (role !== UserRole.instructor && role !== UserRole.org_admin && role !== UserRole.platform_admin) {
      throw new ForbiddenException('Admin or instructor required')
    }
    const orgId = await this.defaultOrgId()
    const orphans = await this.prisma.mediaAsset.findMany({
      where: {
        organizationId: orgId,
        deletedAt: { not: null },
        updatedAt: { lt: new Date(Date.now() - 7 * 86400000) },
      },
      take: 100,
    })
    let removed = 0
    for (const asset of orphans) {
      await this.hardDelete(userId, role, asset.id)
      removed++
    }
    return { removed }
  }

  private async getAuthorizedAsset(
    userId: string,
    role: UserRole,
    assetId: string,
    allowOwnerOnly = false,
  ) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
      include: { course: true, batch: { include: { instructors: true } } },
    })
    if (!asset || asset.deletedAt) throw new NotFoundException('Media asset not found')

    if (asset.visibility === MediaVisibility.public && !allowOwnerOnly) {
      return asset
    }

    if (asset.ownerId === userId) return asset

    if (role === UserRole.instructor) {
      if (asset.course?.instructorId === userId) return asset
      if (
        asset.batch &&
        (asset.batch.instructorId === userId ||
          asset.batch.instructors.some((i) => i.instructorId === userId))
      ) {
        return asset
      }
    }

    if (role === UserRole.student && asset.visibility === MediaVisibility.public) {
      return asset
    }

    if (role === UserRole.org_admin || role === UserRole.platform_admin) {
      return asset
    }

    throw new ForbiddenException('Access denied')
  }
}
