import { BadRequestException } from '@nestjs/common'
import { MediaAssetType } from '@prisma/client'
import type { Express } from 'express'
import { assertSafeUploadFilename } from '../../common/import-file.validation'

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const PDF_MIMES = new Set(['application/pdf'])
const ZIP_MIMES = new Set(['application/zip', 'application/x-zip-compressed'])

const RULES: Record<
  MediaAssetType,
  { maxBytes: number; mimes: Set<string>; extensions: Set<string>; maxWidth?: number; maxHeight?: number }
> = {
  avatar: {
    maxBytes: 5 * 1024 * 1024,
    mimes: IMAGE_MIMES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']),
    maxWidth: 4096,
    maxHeight: 4096,
  },
  course_thumbnail: {
    maxBytes: 10 * 1024 * 1024,
    mimes: IMAGE_MIMES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
    maxWidth: 4096,
    maxHeight: 4096,
  },
  course_banner: {
    maxBytes: 15 * 1024 * 1024,
    mimes: IMAGE_MIMES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
    maxWidth: 6000,
    maxHeight: 3000,
  },
  batch_thumbnail: {
    maxBytes: 10 * 1024 * 1024,
    mimes: IMAGE_MIMES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
  },
  batch_banner: {
    maxBytes: 15 * 1024 * 1024,
    mimes: IMAGE_MIMES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
  },
  lesson_resource: {
    maxBytes: 500 * 1024 * 1024,
    mimes: new Set([...VIDEO_MIMES, ...PDF_MIMES, ...ZIP_MIMES, 'application/octet-stream']),
    extensions: new Set(['mp4', 'webm', 'mov', 'pdf', 'zip']),
  },
  assignment_attachment: {
    maxBytes: 50 * 1024 * 1024,
    mimes: new Set([...PDF_MIMES, ...ZIP_MIMES, ...IMAGE_MIMES, 'text/plain']),
    extensions: new Set(['pdf', 'zip', 'png', 'jpg', 'jpeg', 'txt', 'doc', 'docx']),
  },
  submission_file: {
    maxBytes: 50 * 1024 * 1024,
    mimes: new Set([...PDF_MIMES, ...ZIP_MIMES, ...IMAGE_MIMES, 'text/plain']),
    extensions: new Set(['pdf', 'zip', 'png', 'jpg', 'jpeg', 'txt', 'doc', 'docx']),
  },
  certificate_pdf: {
    maxBytes: 20 * 1024 * 1024,
    mimes: PDF_MIMES,
    extensions: new Set(['pdf']),
  },
  image: {
    maxBytes: 15 * 1024 * 1024,
    mimes: IMAGE_MIMES,
    extensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']),
  },
  document: {
    maxBytes: 50 * 1024 * 1024,
    mimes: new Set([...PDF_MIMES, 'text/plain', 'application/msword']),
    extensions: new Set(['pdf', 'txt', 'doc', 'docx']),
  },
  archive: {
    maxBytes: 200 * 1024 * 1024,
    mimes: ZIP_MIMES,
    extensions: new Set(['zip']),
  },
  other: {
    maxBytes: 100 * 1024 * 1024,
    mimes: new Set<string>(),
    extensions: new Set<string>(),
  },
}

export function validateMediaFile(file: Express.Multer.File, assetType: MediaAssetType) {
  if (assetType === MediaAssetType.other) {
    throw new BadRequestException('A specific asset type is required for uploads')
  }

  assertSafeUploadFilename(file.originalname)

  const rule = RULES[assetType] ?? RULES.other
  if (file.size > rule.maxBytes) {
    throw new BadRequestException(
      `File "${file.originalname}" exceeds maximum size of ${Math.round(rule.maxBytes / 1024 / 1024)}MB`,
    )
  }

  const ext = file.originalname.split('.').pop()?.toLowerCase() ?? ''
  if (rule.mimes.size && !rule.mimes.has(file.mimetype)) {
    throw new BadRequestException(`MIME type "${file.mimetype}" is not allowed for ${assetType}`)
  }
  if (rule.extensions.size && !rule.extensions.has(ext)) {
    throw new BadRequestException(`Extension ".${ext}" is not allowed for ${assetType}`)
  }
}

export function isImageMime(mime: string) {
  return IMAGE_MIMES.has(mime)
}
