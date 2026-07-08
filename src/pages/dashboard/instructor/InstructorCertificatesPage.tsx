import { useCallback, useEffect, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { CertificateTemplatesPanel } from '../../../components/instructor/CertificateTemplatesPanel'
import {
  fetchCertificateTemplates,
  fetchInstructorCertificates,
  issueCertificate,
  reissueCertificate,
  revokeCertificate,
  downloadCertificatePdf,
  type CertificateRecord,
  type CertificateTemplate,
} from '../../../lib/api/certificates'
import { PageIntro, Panel, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { RequestError } from '../../../components/ui/RequestError'

type Tab = 'issued' | 'templates'

export function InstructorCertificatesPage() {
  const { workspace } = useInstructorDashboard()
  const courses = workspace?.courses ?? []

  const [tab, setTab] = useState<Tab>('issued')
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [courseSlug, setCourseSlug] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issueStudentId, setIssueStudentId] = useState('')
  const [issueCourseSlug, setIssueCourseSlug] = useState(courses[0]?.id ?? '')
  const [issueTemplateId, setIssueTemplateId] = useState('')
  const [busy, setBusy] = useState(false)
  const students = workspace?.students ?? []

  const loadCertificates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchInstructorCertificates({
        courseSlug: courseSlug || undefined,
        search: search || undefined,
        status: status || undefined,
      })
      setCertificates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certificates')
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }, [courseSlug, search, status])

  const loadTemplates = useCallback(async () => {
    try {
      const data = await fetchCertificateTemplates()
      setTemplates(data.filter((t) => t.active && t.hasUploadedFile))
    } catch {
      setTemplates([])
    }
  }, [])

  useEffect(() => {
    if (tab === 'issued') void loadCertificates()
  }, [tab, loadCertificates])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const activeCount = certificates.filter((c) => c.status === 'active').length
  const revokedCount = certificates.filter((c) => c.status === 'revoked').length

  const handleIssue = async () => {
    if (!issueStudentId || !issueCourseSlug) return
    setBusy(true)
    setError(null)
    try {
      await issueCertificate({
        studentId: issueStudentId,
        courseSlug: issueCourseSlug,
        templateId: issueTemplateId || undefined,
        bypassRules: true,
      })
      await loadCertificates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue certificate')
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
      await loadCertificates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke certificate')
    } finally {
      setBusy(false)
    }
  }

  const handleReissue = async (id: string) => {
    setBusy(true)
    try {
      await reissueCertificate(id, { templateId: issueTemplateId || undefined })
      await loadCertificates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reissue certificate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Credentials"
        title="Certificate Management"
        description="Upload dynamic certificate templates, issue credentials, and manage verification."
      />

      <div className="mb-6 flex gap-2 border-b border-stone-200">
        {(['issued', 'templates'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors ${
              tab === key
                ? 'border-forest-700 text-forest-800'
                : 'border-transparent text-ink-3 hover:text-ink'
            }`}
            onClick={() => setTab(key)}
          >
            {key === 'issued' ? 'Issued certificates' : 'Templates'}
          </button>
        ))}
      </div>

      {tab === 'templates' ? (
        <CertificateTemplatesPanel />
      ) : (
        <>
          <div className="stat-grid-3 mb-6 sm:mb-8">
            <StatTile label="Total issued" value={certificates.length} />
            <StatTile label="Active" value={activeCount} />
            <StatTile label="Revoked" value={revokedCount} />
          </div>

          {error && <RequestError message={error} onRetry={() => void loadCertificates()} className="mb-6" />}

          <Panel title="Manual issue" className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="input-field h-10 min-w-0 w-full"
                value={issueCourseSlug}
                onChange={(e) => setIssueCourseSlug(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <select
                className="input-field h-10 min-w-0 w-full"
                value={issueStudentId}
                onChange={(e) => setIssueStudentId(e.target.value)}
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
              <select
                className="input-field h-10 min-w-0 w-full"
                value={issueTemplateId}
                onChange={(e) => setIssueTemplateId(e.target.value)}
              >
                <option value="">Default / course template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                disabled={busy || !issueStudentId}
                onClick={() => void handleIssue()}
              >
                Generate certificate
              </Button>
            </div>
          </Panel>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap mb-6">
            <select className="input-field h-10 min-w-0 w-full sm:w-auto" value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <select className="input-field h-10 min-w-0 w-full sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
              <option value="superseded">Superseded</option>
            </select>
            <input
              type="search"
              placeholder="Search student or credential…"
              className="input-field h-10 w-full min-w-0 sm:min-w-[220px] sm:flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <LoadingState label="Loading certificates…" showLogo={false} />
          ) : certificates.length === 0 ? (
            <EmptyState title="No certificates yet" description="Upload a template first, then issue a certificate manually or wait for automatic generation when students complete courses." />
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
                    {cert.status === 'active' && (
                      <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleReissue(cert.id)}>
                        Reissue
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void downloadCertificatePdf(cert.id, cert.certificateNumber)}
                    >
                      Download PDF
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
        </>
      )}
    </div>
  )
}
