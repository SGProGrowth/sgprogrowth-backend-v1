import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  categories,
  defaultCourseDraft,
  getCourseById,
  type InstructorCourse,
} from '../../../data/instructorData'
import { PageIntro, TabBar } from '../../../components/dashboard/PageShell'
import { FormField, FormSection, SelectField, TextAreaField, ToggleField } from '../../../components/instructor/FormField'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { CurriculumEditor } from '../../../components/instructor/CurriculumEditor'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { SuccessBanner, ConfirmDialog } from '../../../components/instructor/Modal'
import { Button } from '../../../components/ui/Button'

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
  const isNew = !courseId || courseId === 'new'
  const existing = courseId && !isNew ? getCourseById(courseId) : undefined

  const [tab, setTab] = useState(searchParams.get('tab') ?? 'basics')
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [course, setCourse] = useState<Partial<InstructorCourse>>(
    existing ?? { ...defaultCourseDraft, id: 'new', modules: [], students: 0, completion: 0, rating: 0, reviewCount: 0, revenue: '—', updatedAt: 'Today' },
  )

  const update = (patch: Partial<InstructorCourse>) => setCourse((c) => ({ ...c, ...patch }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!course.title?.trim()) e.title = 'Course title is required'
    if (!course.description?.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePublish = () => {
    setPublishing(true)
    setTimeout(() => {
      update({ status: 'published' })
      setPublishing(false)
      setShowPublishConfirm(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1500)
  }

  const addOutcome = () => update({ learningOutcomes: [...(course.learningOutcomes ?? []), ''] })
  const addRequirement = () => update({ requirements: [...(course.requirements ?? []), ''] })

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow={isNew ? 'New course' : 'Edit course'}
        title={isNew ? 'Create new course' : course.title ?? 'Edit course'}
        description="Build your coaching-led program. Drafts are saved locally until you publish."
        action={
          <div className="flex flex-wrap gap-2">
            {!isNew && (
              <Button to={`/instructor/courses/${courseId}/preview`} variant="secondary" size="md">Preview</Button>
            )}
            <Button variant="primary" size="md" onClick={handleSave}>Save draft</Button>
          </div>
        }
      />

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
          <UploadZone label="Course thumbnail" hint="Recommended 400×300px — shown in catalog" preview={course.thumbnail ? course.title : undefined} onUpload={() => update({ thumbnail: 'uploaded' })} />
          <UploadZone label="Course banner" aspect="banner" hint="Recommended 1200×400px — shown on course page" preview={course.banner ? course.title : undefined} onUpload={() => update({ banner: 'uploaded' })} />
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
                <Button variant="secondary" size="md" onClick={() => update({ status: 'draft' })}>Unpublish</Button>
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
