import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  CertificateStatus,
  CertificateVerificationResult,
  Prisma,
} from '@prisma/client'
import { randomBytes } from 'crypto'
import { formatDateLabel } from '../../common/utils/course.util'
import {
  InstructorCertificatesQueryDto,
  IssueCertificateDto,
  ReissueCertificateDto,
  RevokeCertificateDto,
  UpdateCertificateRulesDto,
} from '../../common/dto/certificate.dto'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'
import { StorageService } from '../storage/storage.service'
import { CertificatePdfService } from './certificate-pdf.service'
import { CertificateRulesService } from './certificate-rules.service'

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private storage: StorageService,
    private pdfService: CertificatePdfService,
    private rulesService: CertificateRulesService,
    private notificationMail: NotificationMailService,
  ) {}

  private frontendBaseUrl() {
    return (
      this.config.get<string>('FRONTEND_URL') ??
      this.config.get<string>('CORS_ORIGIN')?.split(',')[0] ??
      'http://localhost:5173'
    )
  }

  private verificationUrl(credentialId: string) {
    return `${this.frontendBaseUrl()}/verify/${credentialId}`
  }

  private generateCredentialId() {
    return `SGPG-${randomBytes(8).toString('hex').toUpperCase()}`
  }

  private generateCertificateNumber() {
    const year = new Date().getFullYear()
    return `CERT-${year}-${randomBytes(4).toString('hex').toUpperCase()}`
  }

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private mapCertificate(cert: {
    id: string
    credentialId: string
    certificateNumber: string
    title: string
    studentName: string
    instructorName: string
    skills: string[]
    status: CertificateStatus
    completionDate: Date
    issuedAt: Date
    expiresAt: Date | null
    verificationUrl: string
    course: { slug: string; title: string }
    student?: { email: string }
  }) {
    return {
      id: cert.id,
      credentialId: cert.credentialId,
      certificateNumber: cert.certificateNumber,
      title: cert.title,
      courseId: cert.course.slug,
      courseTitle: cert.course.title,
      studentName: cert.studentName,
      instructorName: cert.instructorName,
      skills: cert.skills,
      status: cert.status,
      completionDate: formatDateLabel(cert.completionDate),
      issuedDate: formatDateLabel(cert.issuedAt),
      expiresAt: cert.expiresAt ? formatDateLabel(cert.expiresAt) : null,
      verificationUrl: cert.verificationUrl,
      shareUrl: cert.verificationUrl,
    }
  }

  async ensureDefaultTemplate(organizationId: string) {
    const existing = await this.prisma.certificateTemplate.findFirst({
      where: { organizationId, isDefault: true, active: true },
    })
    if (existing) return existing

    return this.prisma.certificateTemplate.create({
      data: {
        organizationId,
        name: 'Classic Professional',
        slug: 'classic-professional',
        description: 'Default SG Pro Growth certificate template',
        isDefault: true,
        design: {
          primaryColor: '#1B4332',
          accentColor: '#D4A017',
          borderStyle: 'double',
        },
      },
    })
  }

  async tryAutoIssue(enrollmentId: string) {
    const active = await this.prisma.certificate.findFirst({
      where: { enrollmentId, status: CertificateStatus.active },
    })
    if (active) return active

    const evaluation = await this.rulesService.evaluateEnrollment(enrollmentId)
    if (!evaluation.eligible) return null

    return this.issueCertificateInternal({
      enrollmentId,
      bypassRules: false,
      manual: false,
    })
  }

  async issueCertificate(instructorId: string, dto: IssueCertificateDto) {
    let enrollmentId = dto.enrollmentId

    if (!enrollmentId) {
      if (!dto.courseSlug || !dto.studentId) {
        throw new BadRequestException('Provide enrollmentId or courseSlug + studentId')
      }
      const orgId = await this.defaultOrgId()
      const course = await this.prisma.course.findUnique({
        where: { organizationId_slug: { organizationId: orgId, slug: dto.courseSlug } },
      })
      if (!course || course.instructorId !== instructorId) {
        throw new ForbiddenException('Access denied for this course')
      }
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: dto.studentId, courseId: course.id } },
      })
      if (!enrollment) throw new NotFoundException('Enrollment not found')
      enrollmentId = enrollment.id
    } else {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: true },
      })
      if (!enrollment || enrollment.course.instructorId !== instructorId) {
        throw new ForbiddenException('Access denied')
      }
    }

    return this.issueCertificateInternal({
      enrollmentId,
      templateId: dto.templateId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      bypassRules: dto.bypassRules ?? false,
      manual: true,
      issuedById: instructorId,
    })
  }

  private async issueCertificateInternal(input: {
    enrollmentId: string
    templateId?: string
    expiresAt?: Date
    bypassRules?: boolean
    manual?: boolean
    issuedById?: string
  }) {
    const active = await this.prisma.certificate.findFirst({
      where: { enrollmentId: input.enrollmentId, status: CertificateStatus.active },
    })
    if (active) return this.getCertificateDetail(active.id, active.studentId)

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: input.enrollmentId },
      include: {
        student: { include: { studentProfile: true } },
        course: {
          include: {
            instructor: { include: { instructorProfile: true } },
            organization: true,
            category: true,
          },
        },
      },
    })
    if (!enrollment) throw new NotFoundException('Enrollment not found')

    if (!input.bypassRules) {
      const evaluation = await this.rulesService.evaluateEnrollment(input.enrollmentId)
      if (!evaluation.eligible) {
        throw new BadRequestException({
          message: 'Completion requirements not met',
          failures: evaluation.failures,
        })
      }
    }

    const template =
      (input.templateId
        ? await this.prisma.certificateTemplate.findUnique({ where: { id: input.templateId } })
        : null) ?? (await this.ensureDefaultTemplate(enrollment.organizationId))

    const credentialId = this.generateCredentialId()
    const certificateNumber = this.generateCertificateNumber()
    const verificationUrl = this.verificationUrl(credentialId)
    const studentName =
      enrollment.student.studentProfile?.displayName ?? enrollment.student.email
    const instructorName =
      enrollment.course.instructor.instructorProfile?.displayName ?? 'Instructor'
    const completionDate = enrollment.completedAt ?? new Date()
    const skills = enrollment.course.category?.title
      ? [enrollment.course.category.title, enrollment.course.level ?? 'Professional'].filter(
          Boolean,
        ) as string[]
      : []

    const cert = await this.prisma.certificate.create({
      data: {
        organizationId: enrollment.organizationId,
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        templateId: template.id,
        credentialId,
        certificateNumber,
        title: `${enrollment.course.title} — Certificate of Completion`,
        studentName,
        instructorName,
        skills,
        completionDate,
        expiresAt: input.expiresAt,
        verificationUrl,
        issuedById: input.issuedById,
        metadata: {
          organizationName: enrollment.course.organization.name,
          digitalSignaturePlaceholder: true,
          qrCodeUrl: verificationUrl,
        },
      },
      include: { course: true },
    })

    const pdfBuffer = await this.pdfService.generate({
      organizationName: enrollment.course.organization.name,
      logoUrl: enrollment.course.organization.logoUrl,
      studentName,
      courseTitle: enrollment.course.title,
      instructorName,
      certificateNumber,
      credentialId,
      completionDate,
      issuedAt: cert.issuedAt,
      verificationUrl,
      design: template.design as { primaryColor?: string; accentColor?: string },
    })

    const pdfKey = this.storage.buildKey('certificates', `${credentialId}.pdf`)
    await this.storage.saveBuffer(pdfKey, pdfBuffer)
    await this.prisma.certificate.update({
      where: { id: cert.id },
      data: { pdfStorageKey: pdfKey },
    })

    void this.notificationMail.sendCertificateIssued({
      userId: enrollment.studentId,
      email: enrollment.student.email,
      name: studentName,
      courseTitle: enrollment.course.title,
      credentialId,
      verificationUrl,
      organizationId: enrollment.organizationId,
    })

    return this.getCertificateDetail(cert.id, enrollment.studentId)
  }

  async listStudentCertificates(studentId: string) {
    const certs = await this.prisma.certificate.findMany({
      where: { studentId },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    })
    return certs.map((c) => this.mapCertificate(c))
  }

  async getCertificateDetail(certificateId: string, userId: string, role?: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { course: { include: { instructor: true } }, student: true },
    })
    if (!cert) throw new NotFoundException('Certificate not found')

    if (cert.studentId !== userId && cert.course.instructorId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    return this.mapCertificate(cert)
  }

  async getCertificatePdf(certificateId: string, userId: string, role?: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { course: true },
    })
    if (!cert) throw new NotFoundException('Certificate not found')
    if (cert.studentId !== userId && cert.course.instructorId !== userId) {
      throw new ForbiddenException('Access denied')
    }
    if (!cert.pdfStorageKey) throw new NotFoundException('PDF not available')
    return {
      stream: await this.storage.openReadStream(cert.pdfStorageKey),
      filename: `${cert.certificateNumber}.pdf`,
    }
  }

  async getCertificateHistory(certificateId: string, userId: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { course: true },
    })
    if (!cert) throw new NotFoundException('Certificate not found')
    if (cert.studentId !== userId && cert.course.instructorId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    const related = await this.prisma.certificate.findMany({
      where: {
        OR: [{ id: certificateId }, { reissuedFromId: certificateId }, { id: cert.reissuedFromId ?? undefined }],
        enrollmentId: cert.enrollmentId,
      },
      include: { course: true },
      orderBy: { issuedAt: 'asc' },
    })

    return related.map((c) => this.mapCertificate(c))
  }

  async listInstructorCertificates(instructorId: string, query: InstructorCertificatesQueryDto) {
    const orgId = await this.defaultOrgId()
    const where: Prisma.CertificateWhereInput = {
      course: {
        instructorId,
        organizationId: orgId,
        ...(query.courseSlug ? { slug: query.courseSlug } : {}),
      },
    }
    if (query.status) {
      where.status = query.status as CertificateStatus
    }
    if (query.search?.trim()) {
      const q = query.search.trim()
      where.OR = [
        { studentName: { contains: q, mode: 'insensitive' } },
        { student: { email: { contains: q, mode: 'insensitive' } } },
        { certificateNumber: { contains: q, mode: 'insensitive' } },
        { credentialId: { contains: q, mode: 'insensitive' } },
      ]
    }

    const certs = await this.prisma.certificate.findMany({
      where,
      include: { course: true, student: { include: { studentProfile: true } } },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    })

    return certs.map((c) => ({
      ...this.mapCertificate(c),
      studentId: c.studentId,
      studentEmail: c.student.email,
    }))
  }

  async revokeCertificate(instructorId: string, certificateId: string, dto: RevokeCertificateDto) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { course: true, student: true },
    })
    if (!cert) throw new NotFoundException('Certificate not found')
    if (cert.course.instructorId !== instructorId) throw new ForbiddenException('Access denied')
    if (cert.status === CertificateStatus.revoked) {
      throw new BadRequestException('Certificate already revoked')
    }

    const updated = await this.prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.revoked,
        revokedAt: new Date(),
        revokedById: instructorId,
        revokeReason: dto.reason,
      },
      include: { course: true },
    })

    void this.notificationMail.sendCertificateRevoked({
      userId: cert.studentId,
      email: cert.student.email,
      name: cert.studentName,
      courseTitle: cert.course.title,
      reason: dto.reason,
      organizationId: cert.organizationId,
    })

    return this.mapCertificate(updated)
  }

  async reissueCertificate(
    instructorId: string,
    certificateId: string,
    dto: ReissueCertificateDto,
  ) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { course: true, student: { include: { studentProfile: true } }, enrollment: true },
    })
    if (!cert) throw new NotFoundException('Certificate not found')
    if (cert.course.instructorId !== instructorId) throw new ForbiddenException('Access denied')

    await this.prisma.certificate.update({
      where: { id: certificateId },
      data: { status: CertificateStatus.superseded },
    })

    const template =
      (dto.templateId
        ? await this.prisma.certificateTemplate.findUnique({ where: { id: dto.templateId } })
        : null) ??
      (cert.templateId
        ? await this.prisma.certificateTemplate.findUnique({ where: { id: cert.templateId } })
        : null) ??
      (await this.ensureDefaultTemplate(cert.organizationId))

    const credentialId = this.generateCredentialId()
    const certificateNumber = this.generateCertificateNumber()
    const verificationUrl = this.verificationUrl(credentialId)

    const newCert = await this.prisma.certificate.create({
      data: {
        organizationId: cert.organizationId,
        enrollmentId: cert.enrollmentId,
        courseId: cert.courseId,
        studentId: cert.studentId,
        templateId: template.id,
        credentialId,
        certificateNumber,
        title: cert.title,
        studentName: cert.studentName,
        instructorName: cert.instructorName,
        skills: cert.skills,
        completionDate: cert.completionDate,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : cert.expiresAt,
        verificationUrl,
        reissuedFromId: cert.id,
        issuedById: instructorId,
        metadata: cert.metadata as Prisma.InputJsonValue,
      },
      include: { course: true, student: true },
    })

    const org = await this.prisma.organization.findUnique({
      where: { id: cert.organizationId },
    })
    const pdfBuffer = await this.pdfService.generate({
      organizationName: org?.name ?? 'SG Pro Growth',
      logoUrl: org?.logoUrl,
      studentName: cert.studentName,
      courseTitle: cert.course.title,
      instructorName: cert.instructorName,
      certificateNumber,
      credentialId,
      completionDate: cert.completionDate,
      issuedAt: newCert.issuedAt,
      verificationUrl,
      design: template.design as { primaryColor?: string; accentColor?: string },
    })
    const pdfKey = this.storage.buildKey('certificates', `${credentialId}.pdf`)
    await this.storage.saveBuffer(pdfKey, pdfBuffer)
    await this.prisma.certificate.update({
      where: { id: newCert.id },
      data: { pdfStorageKey: pdfKey },
    })

    void this.notificationMail.sendCertificateReissued({
      userId: cert.studentId,
      email: cert.student.email,
      name: cert.studentName,
      courseTitle: cert.course.title,
      credentialId,
      verificationUrl,
      organizationId: cert.organizationId,
    })

    return this.mapCertificate(newCert)
  }

  async verifyCredential(
    credentialId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const cert = await this.prisma.certificate.findUnique({
      where: { credentialId },
      include: { course: true },
    })

    let result: CertificateVerificationResult = CertificateVerificationResult.invalid
    if (cert) {
      if (cert.status === CertificateStatus.revoked) {
        result = CertificateVerificationResult.revoked
      } else if (cert.expiresAt && cert.expiresAt < new Date()) {
        result = CertificateVerificationResult.expired
        if (cert.status === CertificateStatus.active) {
          await this.prisma.certificate.update({
            where: { id: cert.id },
            data: { status: CertificateStatus.expired },
          })
        }
      } else if (cert.status === CertificateStatus.active) {
        result = CertificateVerificationResult.valid
      } else if (cert.status === CertificateStatus.expired) {
        result = CertificateVerificationResult.expired
      } else {
        result = CertificateVerificationResult.invalid
      }
    }

    await this.prisma.certificateVerification.create({
      data: {
        certificateId: cert?.id,
        credentialId,
        result,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    })

    if (!cert) {
      return {
        valid: false,
        status: 'invalid' as const,
        message: 'Certificate not found',
      }
    }

    return {
      valid: result === CertificateVerificationResult.valid,
      status: result,
      credentialId: cert.credentialId,
      certificateNumber: cert.certificateNumber,
      studentName: cert.studentName,
      courseTitle: cert.course.title,
      instructorName: cert.instructorName,
      completionDate: formatDateLabel(cert.completionDate),
      issuedDate: formatDateLabel(cert.issuedAt),
      expiresAt: cert.expiresAt ? formatDateLabel(cert.expiresAt) : null,
    }
  }

  async getCourseRules(instructorId: string, courseSlug: string) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
      include: { certificateRule: true },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new NotFoundException('Course not found')
    }
    return course.certificateRule ?? { courseId: course.id, ...this.rulesService.defaultRule() }
  }

  async updateCourseRules(
    instructorId: string,
    courseSlug: string,
    dto: UpdateCertificateRulesDto,
  ) {
    const orgId = await this.defaultOrgId()
    const course = await this.prisma.course.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: courseSlug } },
    })
    if (!course || course.instructorId !== instructorId) {
      throw new NotFoundException('Course not found')
    }

    return this.prisma.certificateCompletionRule.upsert({
      where: { courseId: course.id },
      create: { courseId: course.id, ...dto },
      update: { ...dto },
    })
  }

  async listTemplates(instructorId: string) {
    const orgId = await this.defaultOrgId()
    await this.ensureDefaultTemplate(orgId)
    return this.prisma.certificateTemplate.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
  }
}
