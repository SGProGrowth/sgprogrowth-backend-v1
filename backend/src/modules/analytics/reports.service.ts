import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import PDFDocument from 'pdfkit'
import { ReportFormat, ReportType } from '../../common/dto/analytics.dto'
import { PrismaService } from '../../prisma/prisma.module'
import { AnalyticsService } from './analytics.service'

type ReportContext = {
  userId: string
  role: 'student' | 'instructor' | 'admin'
  organizationId?: string
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private analytics: AnalyticsService,
  ) {}

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  async generate(
    type: ReportType,
    format: ReportFormat,
    ctx: ReportContext,
    params: { courseSlug?: string; batchId?: string; from?: string; to?: string },
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const rows = await this.buildRows(type, ctx, params)
    const baseName = `${type}-${new Date().toISOString().slice(0, 10)}`

    if (format === ReportFormat.csv) {
      return {
        buffer: Buffer.from(this.toCsv(rows.headers, rows.data)),
        contentType: 'text/csv',
        filename: `${baseName}.csv`,
      }
    }
    if (format === ReportFormat.xlsx) {
      const buf = await this.toExcel(rows.headers, rows.data, type)
      return { buffer: buf, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `${baseName}.xlsx` }
    }
    return {
      buffer: await this.toPdf(rows.title, rows.headers, rows.data),
      contentType: 'application/pdf',
      filename: `${baseName}.pdf`,
    }
  }

  private async buildRows(
    type: ReportType,
    ctx: ReportContext,
    params: { courseSlug?: string; batchId?: string; from?: string; to?: string },
  ) {
    switch (type) {
      case ReportType.student_progress:
        return this.studentProgressRows(ctx, params)
      case ReportType.assignments:
        return this.assignmentRows(ctx, params)
      case ReportType.quizzes:
        return this.quizRows(ctx, params)
      case ReportType.batches:
        return this.batchRows(ctx, params)
      case ReportType.courses:
        return this.courseRows(ctx, params)
      case ReportType.certificates:
        return this.certificateRows(ctx, params)
      default:
        throw new NotFoundException('Unknown report type')
    }
  }

  private async studentProgressRows(
    ctx: ReportContext,
    params: { courseSlug?: string; batchId?: string },
  ) {
    const orgId = await this.defaultOrgId()
    const studentId = ctx.userId

    if (ctx.role === 'instructor') {
      if (!params.courseSlug) throw new ForbiddenException('courseSlug required for instructor reports')
      const course = await this.prisma.course.findFirst({
        where: { organizationId: orgId, slug: params.courseSlug, instructorId: ctx.userId },
      })
      if (!course) throw new ForbiddenException('Course access denied')
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: course.id, ...(params.batchId ? { batchId: params.batchId } : {}) },
        include: { student: { include: { studentProfile: true } }, course: true },
      })
      return {
        title: `Student Progress — ${course.title}`,
        headers: ['Student', 'Email', 'Progress %', 'Modules', 'Hours', 'Status', 'Last Active'],
        data: enrollments.map((e) => [
          e.student.studentProfile?.displayName ?? e.student.email,
          e.student.email,
          String(e.progressPct),
          String(e.modulesCompleted),
          String(e.hoursSpent),
          e.status,
          e.lastAccessedAt?.toISOString().slice(0, 10) ?? '—',
        ]),
      }
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        ...(params.courseSlug
          ? { course: { slug: params.courseSlug, organizationId: orgId } }
          : {}),
      },
      include: { course: true },
    })

    return {
      title: 'My Learning Progress',
      headers: ['Course', 'Progress %', 'Modules', 'Hours', 'Status'],
      data: enrollments.map((e) => [
        e.course.title,
        String(e.progressPct),
        String(e.modulesCompleted),
        String(e.hoursSpent),
        e.status,
      ]),
    }
  }

  private async assignmentRows(
    ctx: ReportContext,
    params: { courseSlug?: string; from?: string; to?: string },
  ) {
    const orgId = await this.defaultOrgId()
    const from = params.from ? new Date(params.from) : new Date(Date.now() - 90 * 86400000)
    const to = params.to ? new Date(params.to) : new Date()

    const where: Record<string, unknown> = {
      submittedAt: { gte: from, lte: to },
    }

    if (ctx.role === 'student') {
      where.enrollment = { studentId: ctx.userId }
    } else {
      where.assignment = {
        course: {
          organizationId: orgId,
          instructorId: ctx.userId,
          ...(params.courseSlug ? { slug: params.courseSlug } : {}),
        },
      }
    }

    const subs = await this.prisma.assignmentSubmission.findMany({
      where,
      include: {
        assignment: { include: { course: true } },
        enrollment: { include: { student: { include: { studentProfile: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 500,
    })

    return {
      title: 'Assignment Report',
      headers: ['Student', 'Course', 'Assignment', 'Score', 'Max', 'Status', 'Submitted'],
      data: subs.map((s) => [
        s.enrollment.student.studentProfile?.displayName ?? s.enrollment.student.email,
        s.assignment.course.title,
        s.assignment.title,
        s.score != null ? String(s.score) : '—',
        String(s.assignment.maxScore),
        s.status,
        s.submittedAt?.toISOString().slice(0, 10) ?? '—',
      ]),
    }
  }

  private async quizRows(ctx: ReportContext, params: { courseSlug?: string }) {
    const orgId = await this.defaultOrgId()
    const where: Record<string, unknown> = {}

    if (ctx.role === 'student') {
      where.enrollment = { studentId: ctx.userId }
    } else {
      where.quiz = {
        organizationId: orgId,
        instructorId: ctx.userId,
        ...(params.courseSlug ? { course: { slug: params.courseSlug } } : {}),
      }
    }

    const results = await this.prisma.quizResult.findMany({
      where,
      include: {
        quiz: { include: { course: true } },
        enrollment: { include: { student: { include: { studentProfile: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 500,
    })

    return {
      title: 'Quiz Report',
      headers: ['Student', 'Quiz', 'Course', 'Score %', 'Passed', 'Submitted'],
      data: results.map((r) => [
        r.enrollment.student.studentProfile?.displayName ?? r.enrollment.student.email,
        r.quiz.title,
        r.quiz.course?.title ?? '—',
        String(r.percentage),
        r.passed ? 'Yes' : 'No',
        r.submittedAt.toISOString().slice(0, 10),
      ]),
    }
  }

  private async batchRows(ctx: ReportContext, params: { batchId?: string; courseSlug?: string }) {
    if (ctx.role === 'student') throw new ForbiddenException('Batch reports require instructor role')

    const batches = await this.prisma.batch.findMany({
      where: {
        OR: [{ instructorId: ctx.userId }, { instructors: { some: { instructorId: ctx.userId } } }],
        ...(params.batchId ? { id: params.batchId } : {}),
        ...(params.courseSlug ? { course: { slug: params.courseSlug } } : {}),
      },
      include: { course: true, batchEnrollments: true },
    })

    return {
      title: 'Batch Report',
      headers: ['Batch', 'Course', 'Code', 'Students', 'Capacity', 'Completion %', 'Status'],
      data: batches.map((b) => [
        b.name,
        b.course.title,
        b.batchCode,
        String(b.batchEnrollments.filter((e) => e.status !== 'dropped').length),
        String(b.maxCapacity),
        String(Math.round(b.completionRate)),
        b.status,
      ]),
    }
  }

  private async courseRows(ctx: ReportContext, params: { courseSlug?: string }) {
    if (ctx.role === 'student') throw new ForbiddenException('Course reports require instructor role')

    const courses = await this.prisma.course.findMany({
      where: {
        instructorId: ctx.userId,
        ...(params.courseSlug ? { slug: params.courseSlug } : {}),
      },
      include: { _count: { select: { enrollments: true, assignments: true, quizzes: true } } },
    })

    return {
      title: 'Course Report',
      headers: ['Course', 'Status', 'Students', 'Assignments', 'Quizzes', 'Rating'],
      data: courses.map((c) => [
        c.title,
        c.status,
        String(c._count.enrollments),
        String(c._count.assignments),
        String(c._count.quizzes),
        String(c.ratingAvg),
      ]),
    }
  }

  private async certificateRows(ctx: ReportContext, params: { courseSlug?: string }) {
    const orgId = await this.defaultOrgId()
    const where: Record<string, unknown> = { organizationId: orgId, status: 'active' }

    if (ctx.role === 'student') {
      where.enrollment = { studentId: ctx.userId }
    } else {
      where.course = {
        instructorId: ctx.userId,
        ...(params.courseSlug ? { slug: params.courseSlug } : {}),
      }
    }

    const certs = await this.prisma.certificate.findMany({
      where,
      include: {
        course: true,
        enrollment: { include: { student: { include: { studentProfile: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 500,
    })

    return {
      title: 'Certificate Report',
      headers: ['Credential ID', 'Student', 'Course', 'Issued', 'Status'],
      data: certs.map((c) => [
        c.credentialId,
        c.enrollment.student.studentProfile?.displayName ?? c.enrollment.student.email,
        c.course?.title ?? c.title,
        c.issuedAt.toISOString().slice(0, 10),
        c.status,
      ]),
    }
  }

  private toCsv(headers: string[], data: string[][]) {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    return [headers.map(escape).join(','), ...data.map((row) => row.map(escape).join(','))].join('\n')
  }

  private async toExcel(headers: string[], data: string[][], sheetName: string) {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  }

  private async toPdf(title: string, headers: string[], data: string[][]) {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      doc.font('Helvetica-Bold').fontSize(16).text(title, { align: 'center' })
      doc.moveDown()
      doc.font('Helvetica').fontSize(9).text(`Generated ${new Date().toLocaleString()}`, { align: 'center' })
      doc.moveDown()

      const colWidth = (doc.page.width - 80) / headers.length
      let y = doc.y
      doc.font('Helvetica-Bold').fontSize(8)
      headers.forEach((h, i) => doc.text(h, 40 + i * colWidth, y, { width: colWidth - 4 }))
      y += 14
      doc.font('Helvetica').fontSize(7)
      for (const row of data.slice(0, 50)) {
        if (y > doc.page.height - 60) {
          doc.addPage()
          y = 40
        }
        row.forEach((cell, i) => doc.text(cell, 40 + i * colWidth, y, { width: colWidth - 4 }))
        y += 12
      }
      if (data.length > 50) {
        doc.moveDown().fontSize(8).text(`… and ${data.length - 50} more rows. Export CSV/Excel for full data.`)
      }
      doc.end()
    })
  }
}
