import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { Readable } from 'stream'

export type CertificatePdfInput = {
  organizationName: string
  logoUrl?: string | null
  studentName: string
  courseTitle: string
  instructorName: string
  certificateNumber: string
  credentialId: string
  completionDate: Date
  issuedAt: Date
  verificationUrl: string
  design?: {
    primaryColor?: string
    accentColor?: string
    borderStyle?: string
  }
}

@Injectable()
export class CertificatePdfService {
  constructor(private config: ConfigService) {}

  async generate(input: CertificatePdfInput): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(input.verificationUrl, {
      width: 140,
      margin: 1,
    })

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const primary = input.design?.primaryColor ?? '#1B4332'
      const accent = input.design?.accentColor ?? '#D4A017'

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 48,
      })

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const { width, height } = doc.page
      doc.rect(24, 24, width - 48, height - 48).lineWidth(3).stroke(primary)
      doc.rect(32, 32, width - 64, height - 64).lineWidth(1).stroke(accent)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primary)
        .text(input.organizationName.toUpperCase(), 0, 56, { align: 'center' })

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#666666')
        .text('Certificate of Completion', 0, 78, { align: 'center' })

      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#111111')
        .text(input.studentName, 0, 130, { align: 'center' })

      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#444444')
        .text('has successfully completed', 0, 175, { align: 'center' })

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(primary)
        .text(input.courseTitle, 72, 205, { align: 'center', width: width - 144 })

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#444444')
        .text(`Instructor: ${input.instructorName}`, 0, 265, { align: 'center' })

      doc.text(
        `Completion date: ${input.completionDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`,
        0,
        285,
        { align: 'center' },
      )

      doc.text(
        `Issue date: ${input.issuedAt.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`,
        0,
        302,
        { align: 'center' },
      )

      doc
        .moveTo(width / 2 - 120, 350)
        .lineTo(width / 2 + 120, 350)
        .stroke('#999999')
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#666666')
        .text('Authorized Digital Signature', width / 2 - 120, 355, {
          width: 240,
          align: 'center',
        })

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#888888')
        .text(`Certificate No: ${input.certificateNumber}`, 56, height - 72)
      doc.text(`Credential ID: ${input.credentialId}`, 56, height - 58)
      doc.text(`Verify: ${input.verificationUrl}`, 56, height - 44, { width: width - 220 })

      doc.image(qrBuffer, width - 170, height - 150, { width: 100, height: 100 })

      doc.end()
    })
  }

  streamBuffer(buffer: Buffer): Readable {
    return Readable.from(buffer)
  }
}
