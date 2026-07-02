import { getApiBaseUrl } from './client'
import { getAccessToken } from './tokenStorage'

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

export function fetchMyCertificates() {
  return authFetch('/certificates/me') as Promise<CertificateRecord[]>
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
  return authFetch(`/certificates/mine${q ? `?${q}` : ''}`) as Promise<CertificateRecord[]>
}

export function fetchCertificate(id: string) {
  return authFetch(`/certificates/${id}`) as Promise<CertificateRecord>
}

export function fetchCertificateHistory(id: string) {
  return authFetch(`/certificates/${id}/history`) as Promise<CertificateRecord[]>
}

export async function downloadCertificatePdf(id: string, filename: string) {
  const token = getAccessToken()
  const res = await fetch(`${getApiBaseUrl()}/certificates/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to download certificate PDF')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
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

export function issueCertificate(data: {
  enrollmentId?: string
  courseSlug?: string
  studentId?: string
  bypassRules?: boolean
}) {
  return authFetch('/certificates/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<CertificateRecord>
}

export function revokeCertificate(id: string, reason: string) {
  return authFetch(`/certificates/${id}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }) as Promise<CertificateRecord>
}

export function reissueCertificate(id: string) {
  return authFetch(`/certificates/${id}/reissue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
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
