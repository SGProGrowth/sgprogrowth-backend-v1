import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom'
import {
  defaultCourseDraft,
  type InstructorCourse,
} from '../../../data/instructorData'
import { useInstructorCourse, useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, TabBar } from '../../../components/dashboard/PageShell'
import { FormField, FormSection, SelectField, TextAreaField, ToggleField } from '../../../components/instructor/FormField'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { uploadCourseBanner, uploadCourseThumbnail } from '../../../lib/api/media'
import { CurriculumEditor } from '../../../components/instructor/CurriculumEditor'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { SuccessBanner, ConfirmDialog } from '../../../components/instructor/Modal'
import { Button } from '../../../components/ui/Button'
import {
  createCourse,
  instructorCourseToPayload,
  publishCourse,
  replaceCourseCurriculum,
  unpublishCourse,
  updateCourse,
} from '../../../lib/api/courses'
import { fetchCategories, mapCategoryToUi } from '../../../lib/api/categories'
import { getErrorMessage } from '../../../lib/api/errors'

const editorTabs = [
  { id: 'basics', label: 'Course details' },
  { id: 'content', label: 'Description & outcomes' },
  { id: 'media', label: 'Thumbnail & banner' },
  { id: 'curriculum', label: 'Modules & lessons' },
  { id: 'assessments', label: 'Quizzes & assignments' },
  { id: 'pricing', label: 'Pricing & publish' },
]

export function InstructorCourseEditorPage() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile, refresh } = useInstructorDashboard()
  const isNew = !courseId || courseId === 'new'
  const existing = useInstructorCourse(isNew ? undefined : courseId)

  const [tab, setTab] = useState(searchParams.get('tab') ?? 'basics')
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    fetchCategories()
      .then((rows) => setCategories(rows.map(mapCategoryToUi)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (existing) setCourse(existing)
  }, [existing?.id, existing?.updatedAt])

  const [course, setCourse] = useState<Partial<InstructorCourse>>(
    existing ?? {
      ...defaultCourseDraft,
      id: 'new',
      instructorId: profile?.id ?? '',
      modules: [],
      students: 0,
      completion: 0,
      rating: 0,
      reviewCount: 0,
      revenue: '—',
      updatedAt: 'Today',
    },
  )

  const update = (patch: Partial<InstructorCourse>) => setCourse((c) => ({ ...c, ...patch }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!course.title?.trim()) e.title = 'Course title is required'
    if (!course.description?.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setSaveError(null)

    try {
      const payload = instructorCourseToPayload(course)
      let savedCourse: InstructorCourse

      if (isNew) {
        if (!course.title?.trim()) return
        savedCourse = await createCourse({ ...payload, title: course.title.trim() })
        if (course.modules?.length) {
          await replaceCourseCurriculum(savedCourse.id, course.modules)
        }
        await refresh()
        navigate(`/instructor/courses/${savedCourse.id}/edit`, { replace: true })
      } else if (courseId) {
        savedCourse = await updateCourse(courseId, payload)
        if (course.modules) {
          const modules = await replaceCourseCurriculum(courseId, course.modules)
          savedCourse = { ...savedCourse, modules }
        }
        setCourse(savedCourse)
        await refresh()
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!courseId || courseId === 'new') return
    setPublishing(true)
    setSaveError(null)

    try {
      if (course.status !== 'published') {
        await handleSave()
      }
      const published = await publishCourse(courseId)
      setCourse(published)
      await refresh()
      setShowPublishConfirm(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!courseId) return
    try {
      const draft = await unpublishCourse(courseId)
      setCourse(draft)
      await refresh()
    } catch (err) {
      setSaveError(getErrorMessage(err))
    }
  }

  const addOutcome = () => update({ learningOutcomes: [...(course.learningOutcomes ?? []), ''] })
  const addRequirement = () => update({ requirements: [...(course.requirements ?? []), ''] })

  if (!isNew && courseId && !existing) {
    return <Navigate to="/instructor/courses" replace />
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow={isNew ? 'New course' : 'Edit course'}
        title={isNew ? 'Create new course' : course.title ?? 'Edit course'}
        description="Build your coaching-led program. Save drafts to the server and publish when ready."
        action={
          <div className="flex flex-wrap gap-2">
            {!isNew && (
              <Button to={`/instructor/courses/${courseId}/preview`} variant="secondary" size="md">Preview</Button>
            )}
            <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
          </div>
        }
      />

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{saveError}</div>
      )}

      {saved && <SuccessBanner message="Course saved successfully." onDismiss={() => setSaved(false)} />}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={course.status ?? 'draft'} />
        {course.coachingIncluded && (
          <span className="rounded-md bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-700">Coaching included</span>
        )}
      </div>

      <TabBar tabs={editorTabs} active={tab} onChange={setTab} />

      {tab === 'basics' && (
        <div className="space-y-6 max-w-3xl">
          <FormSection title="Basic information" description="Core details learners see in the catalog.">
            <FormField label="Course title" value={course.title ?? ''} onChange={(e) => update({ title: e.target.value })} error={errors.title} required />
            <FormField label="Subtitle" value={course.subtitle ?? ''} onChange={(e) => update({ subtitle: e.target.value })} hint="Short tagline shown under the title" />
            <SelectField
              label="Category"
              value={course.categoryId ?? ''}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value)
                update({ categoryId: e.target.value, category: cat?.title ?? '' })
              }}
              options={categories.map((c) => ({ value: c.id, label: c.title }))}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Level"
                value={course.level ?? 'Intermediate'}
                onChange={(e) => update({ level: e.target.value })}
                options={[
                  { value: 'Beginner', label: 'Beginner' },
                  { value: 'Intermediate', label: 'Intermediate' },
                  { value: 'Advanced', label: 'Advanced' },
                ]}
              />
              <FormField label="Duration" value={course.duration ?? ''} onChange={(e) => update({ duration: e.target.value })} placeholder="e.g. 10 weeks" />
            </div>
            <ToggleField
              label="Include 1:1 coaching"
              description="SG Pro Growth coaching-led model — recommended for all programs"
              checked={course.coachingIncluded ?? true}
              onChange={(v) => update({ coachingIncluded: v })}
            />
          </FormSection>
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-6 max-w-3xl">
          <FormSection title="Course description" description="Describe what learners will achieve.">
            <TextAreaField
              label="Full description"
              value={course.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
              error={errors.description}
              rows={6}
              required
            />
          </FormSection>

          <FormSection title="Learning outcomes" description="What skills will learners gain?">
            {(course.learningOutcomes ?? ['']).map((outcome, i) => (
              <FormField
                key={i}
                label={`Outcome ${i + 1}`}
                value={outcome}
                onChange={(e) => {
                  const next = [...(course.learningOutcomes ?? [])]
                  next[i] = e.target.value
                  update({ learningOutcomes: next })
                }}
              />
            ))}
            <button type="button" onClick={addOutcome} className="text-sm font-semibold text-forest-800">+ Add outcome</button>
          </FormSection>

          <FormSection title="Requirements" description="Prerequisites for enrollment.">
            {(course.requirements ?? ['']).map((req, i) => (
              <FormField
                key={i}
                label={`Requirement ${i + 1}`}
                value={req}
                onChange={(e) => {
                  const next = [...(course.requirements ?? [])]
                  next[i] = e.target.value
                  update({ requirements: next })
                }}
              />
            ))}
            <button type="button" onClick={addRequirement} className="text-sm font-semibold text-forest-800">+ Add requirement</button>
          </FormSection>
        </div>
      )}

      {tab === 'media' && (
        <div className="grid gap-6 max-w-3xl lg:grid-cols-2">
          <UploadZone
            label="Course thumbnail"
            hint="Recommended 400×300px — shown in catalog"
            preview={course.thumbnail && !course.thumbnail.startsWith('http') ? course.title : undefined}
            previewUrl={course.thumbnail?.startsWith('http') ? course.thumbnail : undefined}
            uploadFn={async (file, onProgress) => {
              const asset = await uploadCourseThumbnail(course.id ?? '', file, onProgress)
              update({ thumbnail: asset.downloadUrl })
            }}
          />
          <UploadZone
            label="Course banner"
            aspect="banner"
            hint="Recommended 1200×400px — shown on course page"
            preview={course.banner && !course.banner.startsWith('http') ? course.title : undefined}
            previewUrl={course.banner?.startsWith('http') ? course.banner : undefined}
            uploadFn={async (file, onProgress) => {
              const asset = await uploadCourseBanner(course.id ?? '', file, onProgress)
              update({ banner: asset.downloadUrl })
            }}
          />
        </div>
      )}

      {tab === 'curriculum' && (
        <CurriculumEditor modules={course.modules ?? []} onChange={(modules) => update({ modules })} />
      )}

      {tab === 'assessments' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <FormSection title="Quizzes" description="Knowledge checks and practice exams.">
            <p className="text-sm text-ink-3">Create quizzes from the course curriculum or manage existing assessments.</p>
            <Link to="/instructor/courses" className="inline-flex text-sm font-semibold text-forest-800">View all quizzes →</Link>
            <Button variant="secondary" size="sm" className="mt-2">Create quiz</Button>
          </FormSection>
          <FormSection title="Assignments" description="Projects, labs, and reflections.">
            <p className="text-sm text-ink-3">Assignments are reviewed by you with coaching feedback.</p>
            <Button variant="secondary" size="sm">Create assignment</Button>
          </FormSection>
        </div>
      )}

      {tab === 'pricing' && (
        <div className="space-y-6 max-w-3xl">
          <FormSection title="Pricing" description="Set course price or mark as private/apply-to-enroll.">
            <FormField label="Price (INR)" value={course.price ?? ''} onChange={(e) => update({ price: e.target.value })} placeholder="₹4,999 or Private" />
          </FormSection>

          <FormSection title="Publish settings" description="Control visibility and publication status.">
            <SelectField
              label="Visibility"
              value={course.visibility ?? 'public'}
              onChange={(e) => update({ visibility: e.target.value as InstructorCourse['visibility'] })}
              options={[
                { value: 'public', label: 'Public — listed in catalog' },
                { value: 'private', label: 'Private — invitation only' },
                { value: 'invite', label: 'Apply to enroll' },
              ]}
            />
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-ink">Current status: <StatusBadge status={course.status ?? 'draft'} /></p>
              <p className="mt-1 text-xs text-ink-3">Draft courses are only visible to you. Published courses appear in the catalog.</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="primary" size="md" onClick={() => setShowPublishConfirm(true)} disabled={course.status === 'published'}>
                {course.status === 'published' ? 'Published' : 'Publish course'}
              </Button>
              {course.status === 'published' && (
                <Button variant="secondary" size="md" onClick={handleUnpublish}>Unpublish</Button>
              )}
            </div>
          </FormSection>
        </div>
      )}

      <div className="mt-8 flex items-center gap-4 border-t border-stone-200 pt-6">
        <Button variant="ghost" size="md" onClick={() => navigate('/instructor/courses')}>← Back to courses</Button>
      </div>

      <ConfirmDialog
        open={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={handlePublish}
        title="Publish course?"
        message="This course will become visible in the catalog and open for enrollments."
        confirmLabel="Publish now"
        loading={publishing}
      />
    </div>
  )
}
