import { basename } from 'path'

/** Max upload size — matches largest allowed asset type (lesson_resource). */
export const MAX_UPLOAD_FILE_BYTES = 500 * 1024 * 1024

export const multerMemoryOptions = {
  limits: {
    fileSize: MAX_UPLOAD_FILE_BYTES,
    files: 10,
  },
}

/** Strip path segments and unsafe characters from an uploaded filename. */
export function sanitizeUploadFilename(filename: string): string {
  const base = basename(filename.trim())
  const safe = base.replace(/[^\w.\-() ]+/g, '_').slice(0, 200)
  return safe || 'upload'
}

export function sanitizeContentDispositionFilename(filename: string): string {
  return sanitizeUploadFilename(filename)
}
