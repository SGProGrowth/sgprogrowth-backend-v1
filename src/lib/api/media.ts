import { authorizedFetch, getApiBaseUrl, getAuthBearerToken } from './client'

export type MediaAssetType =
  | 'avatar'
  | 'course_thumbnail'
  | 'course_banner'
  | 'batch_thumbnail'
  | 'batch_banner'
  | 'lesson_resource'
  | 'assignment_attachment'
  | 'submission_file'
  | 'certificate_pdf'
  | 'image'
  | 'document'
  | 'archive'
  | 'other'

export interface MediaAsset {
  id: string
  assetType: MediaAssetType
  visibility: 'public' | 'private'
  filename: string
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  downloadUrl: string
  createdAt: string
}

async function uploadWithProgress(
  path: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<MediaAsset> {
  const token = await getAuthBearerToken()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBaseUrl()}${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as MediaAsset)
        else reject(new Error(body.message ?? `Upload failed (${xhr.status})`))
      } catch {
        reject(new Error('Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}

export async function uploadMediaFile(
  file: File,
  assetType: MediaAssetType,
  fields?: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<MediaAsset> {
  const form = new FormData()
  form.append('file', file)
  form.append('assetType', assetType)
  if (fields) {
    for (const [key, value] of Object.entries(fields)) form.append(key, value)
  }
  return uploadWithProgress('/media/upload', form, onProgress)
}

export function uploadAvatar(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData()
  form.append('file', file)
  return uploadWithProgress('/media/avatars', form, onProgress)
}

export function uploadCourseThumbnail(courseSlug: string, file: File, onProgress?: (pct: number) => void) {
  return uploadMediaFile(file, 'course_thumbnail', { courseSlug }, onProgress)
}

export function uploadCourseBanner(courseSlug: string, file: File, onProgress?: (pct: number) => void) {
  return uploadMediaFile(file, 'course_banner', { courseSlug }, onProgress)
}

export function uploadBatchThumbnail(batchId: string, file: File, onProgress?: (pct: number) => void) {
  return uploadMediaFile(file, 'batch_thumbnail', { batchId }, onProgress)
}

export function uploadLessonResource(lessonId: string, file: File, onProgress?: (pct: number) => void) {
  return uploadMediaFile(file, 'lesson_resource', { lessonId }, onProgress)
}

export function listMedia(params?: {
  search?: string
  type?: MediaAssetType
  courseSlug?: string
  batchId?: string
  page?: number
}) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.type) qs.set('type', params.type)
  if (params?.courseSlug) qs.set('courseSlug', params.courseSlug)
  if (params?.batchId) qs.set('batchId', params.batchId)
  if (params?.page) qs.set('page', String(params.page))
  const q = qs.toString()
  return authorizedFetch(`/media${q ? `?${q}` : ''}`) as Promise<{
    items: MediaAsset[]
    total: number
    page: number
    pageSize: number
  }>
}

export function fetchMediaStats() {
  return authorizedFetch('/media/stats') as Promise<{
    totalFiles: number
    totalBytes: number
    totalMb: number
    provider: string
    byType: Record<string, { count: number; bytes: number }>
  }>
}

export function fetchMediaSignedUrl(id: string, expiresIn?: number) {
  const q = expiresIn ? `?expiresIn=${expiresIn}` : ''
  return authorizedFetch(`/media/${id}/url${q}`) as Promise<{ url: string; expiresIn: number }>
}

export function deleteMediaAsset(id: string) {
  return authorizedFetch(`/media/${id}`, { method: 'DELETE' })
}
