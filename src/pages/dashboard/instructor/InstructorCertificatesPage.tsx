import { useCallback, useEffect, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import {
  fetchInstructorCertificates,
  issueCertificate,
  reissueCertificate,
  revokeCertificate,
  type CertificateRecord,
} from '../../../lib/api/certificates'
import { PageIntro, Panel, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Button } from '../../../components/ui/Button'

export function InstructorCertificatesPage() {
  const { workspace } = useInstructorDashboard()
  const courses = workspace?.courses ?? []
  const students = workspace?.students ?? []

  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [courseSlug, setCourseSlug] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [issueStudentId, setIssueStudentId] = useState('')
  const [issueCourseSlug, setIssueCourseSlug] = useState(courses[0]?.id ?? 'aws-solutions-architect')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchInstructorCertificates({
        courseSlug: courseSlug || undefined,
        search: search || undefined,
        status: status || undefined,
      })
      setCertificates(data)
    } catch {
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }, [courseSlug, search, status])

  useEffect(() => {
    void load()
  }, [load])

  const activeCount = certificates.filter((c) => c.status === 'active').length
  const revokedCount = certificates.filter((c) => c.status === 'revoked').length

  const handleIssue = async () => {
    if (!issueStudentId || !issueCourseSlug) return
    setBusy(true)
    try {
      await issueCertificate({
        studentId: issueStudentId,
        courseSlug: issueCourseSlug,
        bypassRules: true,
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const handleRevoke = async (id: string) => {
    const reason = window.prompt('Revocation reason:')
    if (!reason?.trim()) return
    setBusy(true)
    try {
      await revokeCertificate(id, reason.trim())
      await load()
    } finally {
      setBusy(false)
    }
  }

  const handleReissue = async (id: string) => {
    setBusy(true)
    try {
      await reissueCertificate(id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Credentials"
        title="Certificate Management"
        description="Issue, revoke, and reissue completion certificates for your courses."
      />

      <div className="stat-grid-3 mb-6 sm:mb-8">
        <StatTile label="Total issued" value={certificates.length} />
        <StatTile label="Active" value={activeCount} />
        <StatTile label="Revoked" value={revokedCount} />
      </div>

      <Panel title="Manual issue" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <select
            className="input-field h-10"
            value={issueCourseSlug}
            onChange={(e) => setIssueCourseSlug(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <select
            className="input-field h-10"
            value={issueStudentId}
            onChange={(e) => setIssueStudentId(e.target.value)}
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
          <Button variant="primary" size="md" disabled={busy || !issueStudentId} onClick={() => void handleIssue()}>
            Generate certificate
          </Button>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3 mb-6">
        <select className="input-field h-10" value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select className="input-field h-10" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
          <option value="superseded">Superseded</option>
        </select>
        <input
          type="search"
          placeholder="Search student or credential…"
          className="input-field h-10 min-w-[220px] flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-ink-3 py-8 text-center">Loading certificates…</p>
      ) : certificates.length === 0 ? (
        <EmptyState title="No certificates yet" description="Issue a certificate manually or wait for automatic generation when students complete courses." />
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{cert.studentName}</p>
                  <p className="text-sm text-ink-3">{cert.courseTitle}</p>
                  <p className="text-xs text-ink-4 font-mono mt-1">{cert.credentialId}</p>
                </div>
                <StatusBadge status={cert.status === 'active' ? 'active' : cert.status === 'revoked' ? 'at-risk' : 'completed'} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-3">
                <span>Issued {cert.issuedDate}</span>
                <span>·</span>
                <span>{cert.certificateNumber}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {cert.status === 'active' && (
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleRevoke(cert.id)}>
                    Revoke
                  </Button>
                )}
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleReissue(cert.id)}>
                  Reissue
                </Button>
                <a
                  href={cert.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-stone-200 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-stone-50"
                >
                  Verify link
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
