import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bulkImportTemplateColumns } from '../../../data/instructorData'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, Panel, StatTile } from '../../../components/dashboard/PageShell'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { Modal } from '../../../components/instructor/Modal'
import { SelectField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs'
import { ResponsiveTable, MobileDataCard } from '../../../components/ui/ResponsiveTable'
import {
  downloadBatchImportTemplate,
  executeBatchImport,
  previewBatchImport,
  type BatchImportPreviewRow,
} from '../../../lib/api/batches'

type ImportStep = 'upload' | 'preview' | 'complete'

const statusStyles = {
  valid: 'bg-green-50 text-green-800',
  warning: 'bg-gold-100 text-gold-900',
  error: 'bg-red-50 text-red-800',
  imported: 'bg-green-50 text-green-800',
  skipped: 'bg-stone-100 text-ink-3',
}

export function InstructorBulkImportPage() {
  const { workspace, refresh } = useInstructorDashboard()
  const instructorBatches = workspace?.batches ?? []
  const instructorCourses = workspace?.courses ?? []
  const [step, setStep] = useState<ImportStep>('upload')
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultCourseSlug, setDefaultCourseSlug] = useState(instructorCourses[0]?.id ?? '')
  const [defaultBatchId, setDefaultBatchId] = useState('')
  const [previewRows, setPreviewRows] = useState<BatchImportPreviewRow[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState({ success: 0, warning: 0, error: 0 })

  const validCount = previewRows.filter((r) => r.status === 'valid').length
  const warningCount = previewRows.filter((r) => r.status === 'warning').length
  const errorCount = previewRows.filter((r) => r.status === 'error').length

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const result = await previewBatchImport(file, {
        defaultBatchId: defaultBatchId || undefined,
        defaultCourseSlug: defaultCourseSlug || undefined,
      })
      setPreviewRows(result.rows)
      setJobId(result.jobId)
      setStep('preview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setUploading(false)
    }
  }

  const runImport = async () => {
    if (!jobId) return
    setImporting(true)
    setError(null)
    try {
      const result = await executeBatchImport({ jobId, partialImport: true })
      setImportSummary({
        success: result.successCount,
        warning: warningCount,
        error: result.failureCount,
      })
      setStep('complete')
      refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const resetFlow = () => {
    setStep('upload')
    setPreviewRows([])
    setJobId(null)
    setError(null)
  }

  return (
    <div className="animate-rise">
      <Breadcrumbs
        items={[
          { label: 'Students', href: '/instructor/students' },
          { label: 'Bulk Import' },
        ]}
      />

      <PageIntro
        eyebrow="Enrollments"
        title="Bulk Student Import"
        description="Import student enrollments from a CSV or Excel file. Map columns, validate data, and enroll in batches."
        action={
          <button type="button" onClick={() => setShowTemplate(true)} className="text-sm font-semibold text-forest-800 hover:text-forest-900">
            Download CSV template
          </button>
        }
      />

      <div className="mb-8 flex items-center gap-2">
        {(['upload', 'preview', 'complete'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step === s ? 'bg-forest-800 text-white' : ['preview', 'complete'].indexOf(step) > ['upload', 'preview', 'complete'].indexOf(s) - 1 || (step === 'complete' && s !== 'complete') || (step === 'preview' && s === 'upload')
                ? 'bg-forest-100 text-forest-800'
                : 'bg-stone-100 text-ink-4'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm font-semibold capitalize hidden sm:inline ${step === s ? 'text-ink' : 'text-ink-3'}`}>{s}</span>
            {i < 2 && <div className="h-px w-8 bg-stone-200" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Default course"
              value={defaultCourseSlug}
              onChange={(e) => setDefaultCourseSlug(e.target.value)}
              options={instructorCourses.map((c) => ({ value: c.id, label: c.title }))}
            />
            <SelectField
              label="Default batch"
              value={defaultBatchId}
              onChange={(e) => setDefaultBatchId(e.target.value)}
              options={[
                { value: '', label: 'Select batch (optional)' },
                ...instructorBatches.filter((b) => b.status !== 'completed').map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>

          <Panel title="Upload CSV or Excel file">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {error}
              </div>
            )}
            <UploadZone
              label=""
              accept=".csv,.xlsx,.xls"
              hint="CSV or Excel file with columns: full_name, email, course_slug, batch_name"
              onUpload={handleUpload}
            />
            {uploading && (
              <div className="mt-4 flex items-center gap-3 text-sm text-ink-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-forest-700" />
                Validating file…
              </div>
            )}
          </Panel>

          <Panel title="Required columns" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {bulkImportTemplateColumns.map((col) => (
                <code key={col} className="rounded bg-stone-100 px-2 py-1 text-xs font-mono text-ink-2">{col}</code>
              ))}
            </div>
            <p className="text-xs text-ink-3 mt-3">Optional columns: phone, notes. Email must be unique per course enrollment.</p>
          </Panel>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="stat-grid mb-6 sm:mb-8">
            <StatTile label="Valid rows" value={validCount} hint="Ready to import" />
            <StatTile label="Warnings" value={warningCount} hint="Review before importing" />
            <StatTile label="Errors" value={errorCount} hint="Will be skipped" />
            <StatTile label="Total rows" value={previewRows.length} />
          </div>

          <Panel title="Import preview" noPadding>
            <div className="space-y-3 p-4 lg:hidden">
              {previewRows.map((row) => (
                <MobileDataCard
                  key={row.row}
                  title={`Row ${row.row}: ${row.name}`}
                  subtitle={row.email}
                  badge={
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  }
                  fields={[
                    { label: 'Course', value: row.course },
                    { label: 'Batch', value: row.batch || '—' },
                    ...(row.message ? [{ label: 'Note', value: row.message }] : []),
                  ]}
                />
              ))}
            </div>

            <ResponsiveTable className="hidden lg:block">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-left">
                    <th className="px-4 py-3 font-semibold text-ink-2">Row</th>
                    <th className="px-4 py-3 font-semibold text-ink-2">Name</th>
                    <th className="px-4 py-3 font-semibold text-ink-2">Email</th>
                    <th className="px-4 py-3 font-semibold text-ink-2">Course</th>
                    <th className="px-4 py-3 font-semibold text-ink-2">Batch</th>
                    <th className="px-4 py-3 font-semibold text-ink-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {previewRows.map((row) => (
                    <tr key={row.row} className={row.status === 'error' ? 'bg-red-50/30' : ''}>
                      <td className="px-4 py-3 text-ink-3">{row.row}</td>
                      <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                      <td className="px-4 py-3 text-ink-2">{row.email}</td>
                      <td className="px-4 py-3 text-ink-2">{row.course}</td>
                      <td className="px-4 py-3 text-ink-2">{row.batch || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyles[row.status]}`}>
                          {row.status}
                        </span>
                        {row.message && <p className="text-[10px] text-ink-4 mt-0.5">{row.message}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          </Panel>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="secondary" size="md" className="w-full sm:w-auto" onClick={() => setStep('upload')}>Back</Button>
            <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={runImport} disabled={importing || validCount === 0}>
              {importing ? 'Importing…' : `Import ${validCount} student(s)`}
            </Button>
          </div>
        </>
      )}

      {step === 'complete' && (
        <div className="rounded-xl border border-forest-200 bg-forest-50/50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-100">
            <svg className="h-8 w-8 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-ink mt-4">Import complete</h2>
          <p className="text-sm text-ink-3 mt-2 max-w-md mx-auto">
            {importSummary.success} students enrolled successfully. {importSummary.warning} row(s) skipped with warnings. {importSummary.error} row(s) failed validation.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link to="/instructor/students" className="w-full sm:w-auto"><Button variant="primary" size="md" className="w-full">View students</Button></Link>
            <Button variant="secondary" size="md" className="w-full sm:w-auto" onClick={resetFlow}>Import another file</Button>
          </div>
        </div>
      )}

      <Modal open={showTemplate} onClose={() => setShowTemplate(false)} title="CSV template" size="md">
        <p className="text-sm text-ink-2 mb-4">Use this column structure for your import file:</p>
        <pre className="rounded-lg bg-stone-100 p-4 text-xs font-mono text-ink-2 overflow-x-auto">
          {bulkImportTemplateColumns.join(',')}{'\n'}
          Sneha Desai,sneha.d@example.com,aws-solutions-architect,AWS SAA — June 2026,+91-9876543210,{'\n'}
          Vikram Singh,vikram.s@example.com,it-project-management,IT PM — May 2026,,
        </pre>
        <Button variant="primary" size="sm" className="mt-4" onClick={() => downloadBatchImportTemplate().catch(() => setError('Failed to download template'))}>
          Download template.csv
        </Button>
      </Modal>
    </div>
  )
}
