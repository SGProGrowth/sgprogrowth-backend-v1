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
      },
    })
    if (!cert) {
      this.logger.warn(`Certificate ${job.data.certificateId} not found`)
      return
    }
    if (cert.pdfStorageKey) return

    const snapshot = (cert.designSnapshot ?? {}) as {
      storageKey?: string
      design?: Record<string, unknown>
    }
    if (!snapshot.storageKey) {
      this.logger.warn(`Certificate ${cert.credentialId} has no design snapshot background`)
      return
    }

    const backgroundBuffer = await this.storage.readBuffer(snapshot.storageKey)
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
      verificationUrl: cert.verificationUrl,
      backgroundBuffer,
      design: snapshot.design,
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
