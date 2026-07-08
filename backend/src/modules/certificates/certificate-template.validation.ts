import { BadRequestException } from '@nestjs/common'
import type { Express } from 'express'
import { assertSafeUploadFilename } from '../../common/import-file.validation'
import { sanitizeUploadFilename } from '../../common/multer-options'

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png'])
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])
export const MAX_CERTIFICATE_TEMPLATE_BYTES = 15 * 1024 * 1024

export function validateCertificateTemplateUpload(file: Express.Multer.File) {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Certificate template file is required')
  }

  assertSafeUploadFilename(file.originalname)

  if (file.size > MAX_CERTIFICATE_TEMPLATE_BYTES) {
    throw new BadRequestException(
      `Certificate template exceeds maximum size of ${Math.round(MAX_CERTIFICATE_TEMPLATE_BYTES / 1024 / 1024)}MB`,
    )
  }

  const ext = file.originalname.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new BadRequestException('Certificate templates must be PNG or JPEG images')
  }

  return {
    mimeType: file.mimetype,
    originalName: sanitizeUploadFilename(file.originalname),
    buffer: file.buffer,
    fileSizeBytes: file.size,
  }
}
