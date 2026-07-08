import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import type { Express } from 'express'
import sharp from 'sharp'
import {
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
} from '../../common/dto/certificate.dto'
import { PrismaService } from '../../prisma/prisma.module'
import { StorageService } from '../storage/storage.service'
import { mergeCertificateDesign } from './certificate-design.constants'
import { validateCertificateTemplateUpload } from './certificate-template.validation'

function slugifyName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug || `template-${Date.now()}`
}

@Injectable()
export class CertificateTemplatesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private async assertTemplateManager(userId: string, roles: UserRole[]) {
    if (roles.includes(UserRole.org_admin) || roles.includes(UserRole.platform_admin)) {
      return this.defaultOrgId()
    }
    if (roles.includes(UserRole.instructor)) {
      return this.defaultOrgId()
    }
    throw new ForbiddenException('Only instructors and administrators can manage certificate templates')
  }

  private mapTemplate(template: {
    id: string
    name: string
    slug: string
    description: string | null
    isDefault: boolean
    active: boolean
    design: unknown
    createdAt: Date
    updatedAt: Date
    currentVersion?: {
      id: string
      versionNumber: number
      storageKey: string | null
      mimeType: string | null
      fileSizeBytes: number | null
      originalName: string | null
      design: unknown
      createdAt: Date
    } | null
    courses?: { id: string; slug: string; title: string }[]
  }) {
    const version = template.currentVersion
    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      isDefault: template.isDefault,
      active: template.active,
      design: mergeCertificateDesign(version?.design as Record<string, unknown> ?? template.design),
      hasUploadedFile: Boolean(version?.storageKey),
      currentVersion: version
        ? {
            id: version.id,
            versionNumber: version.versionNumber,
            mimeType: version.mimeType,
            fileSizeBytes: version.fileSizeBytes,
            originalName: version.originalName,
            createdAt: version.createdAt,
          }
        : null,
      assignedCourses: template.courses ?? [],
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }
  }

  async listTemplates(userId: string, roles: UserRole[], includeInactive = false) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const templates = await this.prisma.certificateTemplate.findMany({
      where: {
        organizationId: orgId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        currentVersion: true,
        courses: { select: { id: true, slug: true, title: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
    return templates.map((t) => this.mapTemplate(t))
  }

  async getTemplate(userId: string, roles: UserRole[], templateId: string) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId, organizationId: orgId },
      include: {
        currentVersion: true,
        courses: { select: { id: true, slug: true, title: true } },
      },
    })
    if (!template) throw new NotFoundException('Certificate template not found')
    return this.mapTemplate(template)
  }

  async createTemplate(userId: string, roles: UserRole[], dto: CreateCertificateTemplateDto) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const slug = dto.slug?.trim() || slugifyName(dto.name)
    const existing = await this.prisma.certificateTemplate.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
    })
    if (existing) {
      throw new BadRequestException('A template with this slug already exists')
    }

    const design = mergeCertificateDesign(dto.design)

    const template = await this.prisma.$transaction(async (tx) => {
      const created = await tx.certificateTemplate.create({
        data: {
          organizationId: orgId,
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          isDefault: dto.isDefault ?? false,
          active: false,
          design,
          createdById: userId,
        },
      })

      const version = await tx.certificateTemplateVersion.create({
        data: {
          templateId: created.id,
          versionNumber: 1,
          design,
          createdById: userId,
        },
      })

      if (dto.isDefault) {
        await tx.certificateTemplate.updateMany({
          where: { organizationId: orgId, id: { not: created.id } },
          data: { isDefault: false },
        })
      }

      return tx.certificateTemplate.update({
        where: { id: created.id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true, courses: { select: { id: true, slug: true, title: true } } },
      })
    })

    return this.mapTemplate(template)
  }

  async uploadTemplateVersion(
    userId: string,
    roles: UserRole[],
    templateId: string,
    file: Express.Multer.File,
  ) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const upload = validateCertificateTemplateUpload(file)

    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId, organizationId: orgId },
      include: { currentVersion: true },
    })
    if (!template) throw new NotFoundException('Certificate template not found')

    const metadata = await sharp(upload.buffer).metadata()
    const design = mergeCertificateDesign({
      ...(template.currentVersion?.design as Record<string, unknown>),
      pageWidth: metadata.width ?? 842,
      pageHeight: metadata.height ?? 595,
    })

    const nextVersionNumber = (template.currentVersion?.versionNumber ?? 0) + 1
    const storageKey = this.storage.buildKey(
      'certificate-templates',
      `${template.slug}-v${nextVersionNumber}.png`,
    )

    const normalized = await sharp(upload.buffer).png({ compressionLevel: 8 }).toBuffer()
    await this.storage.saveBuffer(storageKey, normalized, {
      contentType: 'image/png',
      visibility: 'private',
    })

    const updated = await this.prisma.$transaction(async (tx) => {
      const version = await tx.certificateTemplateVersion.create({
        data: {
          templateId: template.id,
          versionNumber: nextVersionNumber,
          storageKey,
          mimeType: 'image/png',
          fileSizeBytes: normalized.length,
          originalName: upload.originalName,
          design,
          createdById: userId,
        },
      })

      return tx.certificateTemplate.update({
        where: { id: template.id },
        data: {
          currentVersionId: version.id,
          design,
          active: true,
        },
        include: {
          currentVersion: true,
          courses: { select: { id: true, slug: true, title: true } },
        },
      })
    })

    return this.mapTemplate(updated)
  }

  async updateTemplate(
    userId: string,
    roles: UserRole[],
    templateId: string,
    dto: UpdateCertificateTemplateDto,
  ) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId, organizationId: orgId },
      include: { currentVersion: true },
    })
    if (!template) throw new NotFoundException('Certificate template not found')

    if (dto.isDefault) {
      await this.prisma.certificateTemplate.updateMany({
        where: { organizationId: orgId, id: { not: templateId } },
        data: { isDefault: false },
      })
    }

    const mergedDesign =
      dto.design !== undefined
        ? mergeCertificateDesign(dto.design)
        : mergeCertificateDesign(template.currentVersion?.design as Record<string, unknown>)

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.certificateTemplate.update({
        where: { id: templateId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
          ...(dto.design !== undefined ? { design: mergedDesign } : {}),
        },
        include: { currentVersion: true, courses: { select: { id: true, slug: true, title: true } } },
      })

      if (dto.design !== undefined && row.currentVersionId) {
        await tx.certificateTemplateVersion.update({
          where: { id: row.currentVersionId },
          data: { design: mergedDesign },
        })
      }

      if (dto.courseSlugs !== undefined) {
        await tx.course.updateMany({
          where: { organizationId: orgId, certificateTemplateId: templateId },
          data: { certificateTemplateId: null },
        })
        if (dto.courseSlugs.length) {
          const courses = await tx.course.findMany({
            where: { slug: { in: dto.courseSlugs }, organizationId: orgId },
            select: { id: true, slug: true },
          })
          if (courses.length !== dto.courseSlugs.length) {
            throw new BadRequestException('One or more courses are invalid for this organization')
          }
          await tx.course.updateMany({
            where: { id: { in: courses.map((c) => c.id) } },
            data: { certificateTemplateId: templateId },
          })
        }
      }

      return tx.certificateTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: { currentVersion: true, courses: { select: { id: true, slug: true, title: true } } },
      })
    })

    return this.mapTemplate(updated)
  }

  async listTemplateVersions(userId: string, roles: UserRole[], templateId: string) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId, organizationId: orgId },
    })
    if (!template) throw new NotFoundException('Certificate template not found')

    const versions = await this.prisma.certificateTemplateVersion.findMany({
      where: { templateId },
      orderBy: { versionNumber: 'desc' },
    })

    return versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      storageKey: v.storageKey,
      mimeType: v.mimeType,
      fileSizeBytes: v.fileSizeBytes,
      originalName: v.originalName,
      createdAt: v.createdAt,
      isCurrent: template.currentVersionId === v.id,
    }))
  }

  async getTemplatePreviewStream(userId: string, roles: UserRole[], templateId: string) {
    const orgId = await this.assertTemplateManager(userId, roles)
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId, organizationId: orgId },
      include: { currentVersion: true },
    })
    if (!template?.currentVersion?.storageKey) {
      throw new NotFoundException('Template preview is not available until a file is uploaded')
    }

    return {
      stream: await this.storage.openReadStream(template.currentVersion.storageKey),
      mimeType: template.currentVersion.mimeType ?? 'image/png',
      filename: template.currentVersion.originalName ?? `${template.slug}.png`,
    }
  }

  async resolveTemplateForIssue(
    organizationId: string,
    options: { templateId?: string; courseId?: string },
  ) {
    type TemplateWithVersion = NonNullable<
      Awaited<
        ReturnType<
          typeof this.prisma.certificateTemplate.findFirst<{
            include: { currentVersion: true }
          }>
        >
      >
    >

    let template: TemplateWithVersion | null = null

    if (options.templateId) {
      template = await this.prisma.certificateTemplate.findFirst({
        where: { id: options.templateId, organizationId, active: true },
        include: { currentVersion: true },
      })
      if (!template) throw new BadRequestException('Selected certificate template is not available')
    } else if (options.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: options.courseId },
        include: {
          certificateTemplate: { include: { currentVersion: true } },
        },
      })
      if (course?.certificateTemplate?.active) {
        template = course.certificateTemplate
      }
    }

    if (!template) {
      template = await this.prisma.certificateTemplate.findFirst({
        where: { organizationId, active: true, isDefault: true },
        include: { currentVersion: true },
      })
    }

    if (!template) {
      template = await this.prisma.certificateTemplate.findFirst({
        where: { organizationId, active: true },
        include: { currentVersion: true },
        orderBy: { updatedAt: 'desc' },
      })
    }

    if (!template?.currentVersion) {
      throw new BadRequestException(
        'No active certificate template is configured. Upload a template before issuing certificates.',
      )
    }

    if (!template.currentVersion.storageKey) {
      throw new BadRequestException(
        `Template "${template.name}" has no uploaded design file. Upload a PNG or JPEG background first.`,
      )
    }

    const design = mergeCertificateDesign(template.currentVersion.design as Record<string, unknown>)

    return {
      template,
      version: template.currentVersion,
      snapshot: {
        templateId: template.id,
        templateVersionId: template.currentVersion.id,
        versionNumber: template.currentVersion.versionNumber,
        storageKey: template.currentVersion.storageKey,
        mimeType: template.currentVersion.mimeType,
        design,
        templateName: template.name,
      },
    }
  }
}
