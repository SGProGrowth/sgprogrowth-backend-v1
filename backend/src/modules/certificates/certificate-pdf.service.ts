import { Injectable } from '@nestjs/common'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { Readable } from 'stream'
import {
  CertificateDesign,
  CertificateFieldLayout,
  mergeCertificateDesign,
} from './certificate-design.constants'

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
  backgroundBuffer?: Buffer | null
  design?: CertificateDesign | Record<string, unknown> | null
}

@Injectable()
export class CertificatePdfService {
  private formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  private drawField(
    doc: InstanceType<typeof PDFDocument>,
    layout: CertificateFieldLayout,
    text: string,
    pageWidth: number,
    defaultColor: string,
    fontWeight: 'normal' | 'bold' = 'normal',
  ) {
    const width = layout.width ?? pageWidth - 144
    const x = layout.align === 'center' ? 0 : layout.x
    const options = {
      width: layout.align === 'center' ? pageWidth : width,
      align: layout.align ?? 'left',
    } as const

    doc
      .font(layout.fontWeight === 'bold' || fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(layout.fontSize ?? 12)
      .fillColor(layout.color ?? defaultColor)
      .text(text, x, layout.y, options)
  }

  async generate(input: CertificatePdfInput): Promise<Buffer> {
    if (!input.backgroundBuffer?.length) {
      throw new Error('Certificate background template is required')
    }

    const design = mergeCertificateDesign(input.design)
    const pageWidth = design.pageWidth ?? 842
    const pageHeight = design.pageHeight ?? 595
    const primary = design.primaryColor ?? '#062D6F'
    const fields = design.fields ?? {}

    const qrBuffer = design.showQrCode
      ? await QRCode.toBuffer(input.verificationUrl, { width: 140, margin: 1 })
      : null

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const doc = new PDFDocument({
        size: [pageWidth, pageHeight],
        margin: 0,
      })

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      doc.image(input.backgroundBuffer!, 0, 0, { width: pageWidth, height: pageHeight })

      if (fields.organizationName) {
        this.drawField(
          doc,
          { ...fields.organizationName, fontWeight: 'bold', color: fields.organizationName.color ?? primary },
          input.organizationName.toUpperCase(),
          pageWidth,
          primary,
          'bold',
        )
      }

      if (fields.subtitle) {
        this.drawField(doc, fields.subtitle, 'Certificate of Completion', pageWidth, '#666666')
      }

      if (fields.studentName) {
        this.drawField(doc, fields.studentName, input.studentName, pageWidth, '#111111', 'bold')
      }

      if (fields.completionLine) {
        this.drawField(doc, fields.completionLine, 'has successfully completed', pageWidth, '#444444')
      }

      if (fields.courseTitle) {
        this.drawField(doc, fields.courseTitle, input.courseTitle, pageWidth, primary, 'bold')
      }

      if (fields.instructor) {
        this.drawField(doc, fields.instructor, `Instructor: ${input.instructorName}`, pageWidth, '#444444')
      }

      if (fields.completionDate) {
        this.drawField(
          doc,
          fields.completionDate,
          `Completion date: ${this.formatDate(input.completionDate)}`,
          pageWidth,
          '#444444',
        )
      }

      if (fields.issueDate) {
        this.drawField(
          doc,
          fields.issueDate,
          `Issue date: ${this.formatDate(input.issuedAt)}`,
          pageWidth,
          '#444444',
        )
      }

      if (design.showSignature && fields.signature) {
        const sig = fields.signature
        doc
          .moveTo(sig.x, sig.y - 5)
          .lineTo(sig.x + (sig.width ?? 240), sig.y - 5)
          .stroke('#999999')
        this.drawField(doc, sig, 'Authorized Digital Signature', pageWidth, '#666666')
      }

      if (fields.certificateNumber) {
        this.drawField(
          doc,
          fields.certificateNumber,
          `Certificate No: ${input.certificateNumber}`,
          pageWidth,
          '#888888',
        )
      }

      if (fields.credentialId) {
        this.drawField(
          doc,
          fields.credentialId,
          `Credential ID: ${input.credentialId}`,
          pageWidth,
          '#888888',
        )
      }

      if (fields.verifyUrl) {
        this.drawField(doc, fields.verifyUrl, `Verify: ${input.verificationUrl}`, pageWidth, '#888888')
      }

      if (design.showQrCode && qrBuffer && fields.qrCode) {
        doc.image(qrBuffer, fields.qrCode.x, fields.qrCode.y, {
          width: fields.qrCode.size,
          height: fields.qrCode.size,
        })
      }

      doc.end()
    })
  }

  streamBuffer(buffer: Buffer): Readable {
    return Readable.from(buffer)
  }
}
