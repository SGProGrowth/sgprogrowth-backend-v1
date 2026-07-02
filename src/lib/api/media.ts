import { getApiBaseUrl } from './client'
import { getAccessToken } from './tokenStorage'

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

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (payload as { message?: string | string[] }).message ?? `Request failed (${res.status})`
    throw new Error(Array.isArray(message) ? message.join(', ') : String(message))
  }
  return payload
}

export async function uploadMediaFile(
  file: File,
  assetType: MediaAssetType,
  fields?: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<MediaAsset> {
  const token = getAccessToken()
  const form = new FormData()
  form.append('file', file)
  form.append('assetType', assetType)
  if (fields) {
    for (const [k, v] of Object.entries(fields)) form.append(k, v)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBaseUrl()}/media/upload`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
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

export function uploadAvatar(file: File, onProgress?: (pct: number) => void) {
  const token = getAccessToken()
  const form = new FormData()
  form.append('file', file)
  return new Promise<MediaAsset>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBaseUrl()}/media/avatars`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
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
  return authFetch(`/media${q ? `?${q}` : ''}`) as Promise<{
    items: MediaAsset[]
    total: number
    page: number
    pageSize: number
  }>
}

export function fetchMediaStats() {
  return authFetch('/media/stats') as Promise<{
    totalFiles: number
    totalBytes: number
    totalMb: number
    provider: string
    byType: Record<string, { count: number; bytes: number }>
  }>
}

export function fetchMediaSignedUrl(id: string, expiresIn?: number) {
  const q = expiresIn ? `?expiresIn=${expiresIn}` : ''
  return authFetch(`/media/${id}/url${q}`) as Promise<{ url: string; expiresIn: number }>
}

export function deleteMediaAsset(id: string) {
  return authFetch(`/media/${id}`, { method: 'DELETE' })
}
