import { useCallback, useEffect, useState } from 'react'
import { useInstructorDashboard } from '../../hooks/useInstructorDashboard'
import {
  createCertificateTemplate,
  fetchCertificateTemplatePreviewUrl,
  fetchCertificateTemplates,
  updateCertificateTemplate,
  uploadCertificateTemplate,
  type CertificateTemplate,
} from '../../lib/api/certificates'
import { Button } from '../ui/Button'
import { FormField } from './FormField'
import { LoadingState } from '../ui/LoadingState'
import { RequestError } from '../ui/RequestError'

export function CertificateTemplatesPanel() {
  const { workspace } = useInstructorDashboard()
  const courses = workspace?.courses ?? []

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCertificateTemplates()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const loadPreview = async (templateId: string) => {
    try {
      const url = await fetchCertificateTemplatePreviewUrl(templateId)
      setPreviewUrls((prev) => {
        if (prev[templateId]) URL.revokeObjectURL(prev[templateId])
        return { ...prev, [templateId]: url }
      })
    } catch {
      setError('Preview unavailable for this template')
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setBusy(true)
    setError(null)
    try {
      await createCertificateTemplate({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        isDefault: templates.length === 0,
      })
      setNewName('')
      setNewDescription('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async (templateId: string, file: File) => {
    setBusy(true)
    setUploadProgress(0)
    setError(null)
    try {
      await uploadCertificateTemplate(templateId, file, setUploadProgress)
      await load()
      await loadPreview(templateId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      setUploadProgress(null)
    }
  }

  const handleToggleActive = async (template: CertificateTemplate) => {
    setBusy(true)
    try {
      await updateCertificateTemplate(template.id, { active: !template.active })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const handleSetDefault = async (templateId: string) => {
    setBusy(true)
    try {
      await updateCertificateTemplate(templateId, { isDefault: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const handleAssignCourses = async (templateId: string, courseSlugs: string[]) => {
    setBusy(true)
    try {
      await updateCertificateTemplate(templateId, { courseSlugs })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign courses')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingState label="Loading certificate templates…" showLogo={false} />

  return (
    <div className="space-y-6">
      {error && <RequestError message={error} onRetry={() => void load()} />}

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="font-display text-base font-bold text-ink">Create template</h3>
        <p className="mt-1 text-sm text-ink-3">
          Add a template record, then upload a PNG or JPEG background design.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FormField label="Template name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <FormField
            label="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          className="mt-4"
          disabled={busy || !newName.trim()}
          onClick={() => void handleCreate()}
        >
          Create template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center text-sm text-ink-3">
          No certificate templates yet. Create one and upload a background image to start issuing certificates.
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink">{template.name}</h3>
                    {template.isDefault && (
                      <span className="rounded-md bg-forest-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forest-800">
                        Default
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        template.active ? 'bg-forest-50 text-forest-800' : 'bg-stone-100 text-ink-3'
                      }`}
                    >
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                    {!template.hasUploadedFile && (
                      <span className="rounded-md bg-gold-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700">
                        Upload required
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="mt-1 text-sm text-ink-3">{template.description}</p>
                  )}
                  {template.currentVersion && (
                    <p className="mt-2 text-xs text-ink-4">
                      Version {template.currentVersion.versionNumber}
                      {template.currentVersion.originalName
                        ? ` · ${template.currentVersion.originalName}`
                        : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!template.isDefault && template.hasUploadedFile && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleSetDefault(template.id)}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy || !template.hasUploadedFile}
                    onClick={() => void handleToggleActive(template)}
                  >
                    {template.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4 lg:flex-row">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-3">
                    Upload / replace background (PNG or JPEG, max 15MB)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="mt-2 block w-full text-sm text-ink-3 file:mr-3 file:rounded-md file:border-0 file:bg-forest-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleUpload(template.id, file)
                      e.target.value = ''
                    }}
                  />
                  {uploadProgress !== null && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-forest-700 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {template.hasUploadedFile && (
                  <div className="w-full lg:w-72">
                    {previewUrls[template.id] ? (
                      <img
                        src={previewUrls[template.id]}
                        alt={`${template.name} preview`}
                        className="w-full rounded-lg border border-stone-200 object-cover"
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void loadPreview(template.id)}
                      >
                        Load preview
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {courses.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">
                    Assigned courses
                  </label>
                  <select
                    multiple
                    className="input-field min-h-24 w-full"
                    value={template.assignedCourses.map((c) => c.slug)}
                    disabled={busy}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
                      void handleAssignCourses(template.id, selected)
                    }}
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-ink-4">
                    Hold Cmd/Ctrl to select multiple courses. Unassigned courses use the default template.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
