import { BadRequestException } from '@nestjs/common'
import { basename } from 'path'
import type { Express } from 'express'

/** Max size for CSV / spreadsheet import uploads (not lesson videos). */
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024

const CSV_MIMES = new Set(['text/csv', 'application/csv', 'text/plain', 'application/octet-stream'])
const EXCEL_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
])

export function assertSafeUploadFilename(filename: string): string {
  const trimmed = filename?.trim()
  if (!trimmed) {
    throw new BadRequestException('Filename is required')
  }
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('\0')) {
    throw new BadRequestException('Invalid filename')
  }
  const base = basename(trimmed)
  if (base !== trimmed || !base.length) {
    throw new BadRequestException('Invalid filename')
  }
  return base
}

export function validateCsvImportFile(file: Express.Multer.File) {
  assertSafeUploadFilename(file.originalname)
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new BadRequestException(
      `Import file exceeds maximum size of ${Math.round(MAX_IMPORT_FILE_BYTES / 1024 / 1024)}MB`,
    )
  }
  const ext = file.originalname.split('.').pop()?.toLowerCase()
  if (ext !== 'csv') {
    throw new BadRequestException('CSV import requires a .csv file')
  }
  if (!CSV_MIMES.has(file.mimetype)) {
    throw new BadRequestException(`MIME type "${file.mimetype}" is not allowed for CSV import`)
  }
}

export function validateExcelImportFile(file: Express.Multer.File) {
  assertSafeUploadFilename(file.originalname)
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new BadRequestException(
      `Import file exceeds maximum size of ${Math.round(MAX_IMPORT_FILE_BYTES / 1024 / 1024)}MB`,
    )
  }
  const ext = file.originalname.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    throw new BadRequestException('Excel import requires a .xlsx or .xls file')
  }
  if (!EXCEL_MIMES.has(file.mimetype)) {
    throw new BadRequestException(`MIME type "${file.mimetype}" is not allowed for Excel import`)
  }
}
