import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../../prisma/prisma.module'
import { StorageService } from '../../modules/storage/storage.service'
import { CertificatePdfService } from '../../modules/certificates/certificate-pdf.service'
import { QUEUE_CERTIFICATES } from '../queue.constants'

export type CertificateJobData = {
  certificateId: string
}

@Processor(QUEUE_CERTIFICATES)
export class CertificateProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificateProcessor.name)

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private pdfService: CertificatePdfService,
  ) {
    super()
  }

  async process(job: Job<CertificateJobData>): Promise<void> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: job.data.certificateId },
      include: {
        course: { include: { organization: true, instructor: true } },
        template: true,
      },
    })
    if (!cert) {
      this.logger.warn(`Certificate ${job.data.certificateId} not found`)
      return
    }
    if (cert.pdfStorageKey) return

    const verificationUrl = cert.verificationUrl
    const pdfBuffer = await this.pdfService.generate({
      organizationName: cert.course.organization.name,
      logoUrl: cert.course.organization.logoUrl,
      studentName: cert.studentName,
      courseTitle: cert.course.title,
      instructorName: cert.instructorName,
      certificateNumber: cert.certificateNumber,
      credentialId: cert.credentialId,
      completionDate: cert.completionDate,
      issuedAt: cert.issuedAt,
      verificationUrl,
      design: (cert.template?.design ?? {}) as { primaryColor?: string; accentColor?: string },
    })

    const pdfKey = this.storage.buildKey('certificates', `${cert.credentialId}.pdf`)
    await this.storage.saveBuffer(pdfKey, pdfBuffer, { contentType: 'application/pdf' })
    await this.prisma.certificate.update({
      where: { id: cert.id },
      data: { pdfStorageKey: pdfKey },
    })
    this.logger.log(`Certificate PDF generated for ${cert.credentialId}`)
  }
}
