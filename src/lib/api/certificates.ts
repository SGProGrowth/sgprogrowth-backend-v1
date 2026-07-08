import {
  authorizedDownload,
  authorizedFetch,
  getApiBaseUrl,
  getAuthBearerToken,
} from './client'

export interface CertificateRecord {
  id: string
  credentialId: string
  certificateNumber: string
  title: string
  courseId: string
  courseTitle: string
  studentName: string
  instructorName: string
  skills: string[]
  status: 'active' | 'revoked' | 'expired' | 'superseded'
  completionDate: string
  issuedDate: string
  expiresAt: string | null
  verificationUrl: string
  shareUrl: string
  studentId?: string
  studentEmail?: string
}

export interface CertificateVerification {
  valid: boolean
  status: 'valid' | 'invalid' | 'revoked' | 'expired'
  message?: string
  credentialId?: string
  certificateNumber?: string
  studentName?: string
  courseTitle?: string
  instructorName?: string
  completionDate?: string
  issuedDate?: string
  expiresAt?: string | null
}

export interface CertificateTemplate {
  id: string
  name: string
  slug: string
  description?: string | null
  isDefault: boolean
  active: boolean
  hasUploadedFile: boolean
  design: {
    primaryColor?: string
    accentColor?: string
    pageWidth?: number
    pageHeight?: number
  }
  currentVersion?: {
    id: string
    versionNumber: number
    mimeType?: string | null
    fileSizeBytes?: number | null
    originalName?: string | null
    createdAt: string
  } | null
  assignedCourses: { id: string; slug: string; title: string }[]
  createdAt: string
  updatedAt: string
}

export interface CertificateTemplateVersion {
  id: string
  versionNumber: number
  mimeType?: string | null
  fileSizeBytes?: number | null
  originalName?: string | null
  createdAt: string
  isCurrent: boolean
}

export interface CertificateCompletionRule {
  courseId: string
  requireProgressPct: number
  requireAllLessons: boolean
  requireAssignmentsSubmitted: boolean
  minAssignmentScorePct?: number | null
  requireQuizPass: boolean
  minQuizPassPct: number
  requireLiveSessions: boolean
}

export function fetchMyCertificates() {
  return authorizedFetch('/certificates/me') as Promise<CertificateRecord[]>
}

export function fetchInstructorCertificates(params?: {
  courseSlug?: string
  search?: string
  status?: string
}) {
  const qs = new URLSearchParams()
  if (params?.courseSlug) qs.set('courseSlug', params.courseSlug)
  if (params?.search) qs.set('search', params.search)
  if (params?.status) qs.set('status', params.status)
  const q = qs.toString()
  return authorizedFetch(`/certificates/mine${q ? `?${q}` : ''}`) as Promise<CertificateRecord[]>
}

export function fetchCertificate(id: string) {
  return authorizedFetch(`/certificates/${id}`) as Promise<CertificateRecord>
}

export function fetchCertificateHistory(id: string) {
  return authorizedFetch(`/certificates/${id}/history`) as Promise<CertificateRecord[]>
}

export async function downloadCertificatePdf(id: string, filename: string) {
  return authorizedDownload(
    `/certificates/${id}/pdf`,
    filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
  )
}

export function verifyCertificatePublic(credentialId: string) {
  return fetch(`${getApiBaseUrl()}/certificates/verify/${encodeURIComponent(credentialId)}`, {
    headers: { Accept: 'application/json' },
  }).then(async (res) => {
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error((body as { message?: string }).message ?? 'Verification failed')
    }
    return body as CertificateVerification
  })
}

export function fetchCertificateTemplates() {
  return authorizedFetch('/certificates/templates') as Promise<CertificateTemplate[]>
}

export function createCertificateTemplate(data: {
  name: string
  description?: string
  isDefault?: boolean
}) {
  return authorizedFetch('/certificates/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<CertificateTemplate>
}

export function updateCertificateTemplate(
  templateId: string,
  data: {
    name?: string
    description?: string
    active?: boolean
    isDefault?: boolean
    courseSlugs?: string[]
    design?: Record<string, unknown>
  },
) {
  return authorizedFetch(`/certificates/templates/${templateId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<CertificateTemplate>
}

export function fetchCertificateTemplateVersions(templateId: string) {
  return authorizedFetch(`/certificates/templates/${templateId}/versions`) as Promise<
    CertificateTemplateVersion[]
  >
}

export async function uploadCertificateTemplate(
  templateId: string,
  file: File,
  onProgress?: (pct: number) => void,
) {
  const token = await getAuthBearerToken()
  const form = new FormData()
  form.append('file', file)

  return new Promise<CertificateTemplate>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBaseUrl()}/certificates/templates/${templateId}/upload`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as CertificateTemplate)
        else reject(new Error(body.message ?? `Upload failed (${xhr.status})`))
      } catch {
        reject(new Error('Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}

export async function fetchCertificateTemplatePreviewUrl(templateId: string) {
  const token = await getAuthBearerToken()
  const res = await fetch(`${getApiBaseUrl()}/certificates/templates/${templateId}/preview`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Preview unavailable')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export function fetchCourseCertificateRules(courseSlug: string) {
  return authorizedFetch(`/certificates/courses/${courseSlug}/rules`) as Promise<CertificateCompletionRule>
}

export function updateCourseCertificateRules(
  courseSlug: string,
  data: Partial<CertificateCompletionRule>,
) {
  return authorizedFetch(`/certificates/courses/${courseSlug}/rules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<CertificateCompletionRule>
}

export function issueCertificate(data: {
  enrollmentId?: string
  courseSlug?: string
  studentId?: string
  templateId?: string
  bypassRules?: boolean
  expiresAt?: string
}) {
  return authorizedFetch('/certificates/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<CertificateRecord>
}

export function revokeCertificate(id: string, reason: string) {
  return authorizedFetch(`/certificates/${id}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }) as Promise<CertificateRecord>
}

export function reissueCertificate(
  id: string,
  data?: { templateId?: string; expiresAt?: string },
) {
  return authorizedFetch(`/certificates/${id}/reissue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  }) as Promise<CertificateRecord>
}

export function shareCertificateLinkedIn(cert: CertificateRecord) {
  const url = encodeURIComponent(cert.verificationUrl)
  const title = encodeURIComponent(`${cert.courseTitle} — Certificate of Completion`)
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function copyVerificationLink(url: string) {
  return navigator.clipboard.writeText(url)
}
