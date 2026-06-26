import { useState } from 'react'
import type { CourseModule, LessonType } from '../../data/instructorData'
import { LessonTypeBadge } from './StatusBadge'
import { Modal } from './Modal'
import { FormField } from './FormField'
import { SelectField } from './FormField'
import { FileUploadList } from './UploadZone'
import { Button } from '../ui/Button'

interface CurriculumEditorProps {
  modules: CourseModule[]
  onChange: (modules: CourseModule[]) => void
}

export function CurriculumEditor({ modules, onChange }: CurriculumEditorProps) {
  const [expanded, setExpanded] = useState<string | null>(modules[0]?.id ?? null)
  const [lessonModal, setLessonModal] = useState<{ moduleId: string } | null>(null)
  const [moduleModal, setModuleModal] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLesson, setNewLesson] = useState({ title: '', type: 'video' as LessonType, duration: '30 min' })

  const addModule = () => {
    if (!newModuleTitle.trim()) return
    const mod: CourseModule = {
      id: `m-${Date.now()}`,
      title: newModuleTitle,
      order: modules.length + 1,
      lessons: [],
    }
    onChange([...modules, mod])
    setNewModuleTitle('')
    setModuleModal(false)
  }

  const addLesson = () => {
    if (!lessonModal || !newLesson.title.trim()) return
    onChange(
      modules.map((m) =>
        m.id === lessonModal.moduleId
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                { id: `l-${Date.now()}`, ...newLesson, order: m.lessons.length + 1 },
              ],
            }
          : m,
      ),
    )
    setNewLesson({ title: '', type: 'video', duration: '30 min' })
    setLessonModal(null)
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center">
          <p className="font-semibold text-ink">No modules yet</p>
          <p className="mt-1 text-sm text-ink-3">Add your first module to start building curriculum.</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => setModuleModal(true)}>Add module</Button>
        </div>
      ) : (
        modules.map((mod) => (
          <div key={mod.id} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50"
              onClick={() => setExpanded(expanded === mod.id ? null : mod.id)}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Module {mod.order}</p>
                <p className="font-display text-sm font-bold text-ink">{mod.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-3">{mod.lessons.length} lessons</span>
                <svg className={`h-5 w-5 text-ink-3 transition-transform ${expanded === mod.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expanded === mod.id && (
              <div className="border-t border-stone-100 px-5 py-4">
                <ul className="space-y-2">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-ink-4">{lesson.order}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{lesson.title}</p>
                          <p className="text-xs text-ink-3">{lesson.duration}</p>
                        </div>
                      </div>
                      <LessonTypeBadge type={lesson.type} />
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setLessonModal({ moduleId: mod.id })}
                  className="mt-3 text-sm font-semibold text-forest-800 hover:text-forest-900"
                >
                  + Add lesson
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {modules.length > 0 && (
        <Button variant="secondary" size="md" onClick={() => setModuleModal(true)}>Add module</Button>
      )}

      <Modal
        open={moduleModal}
        onClose={() => setModuleModal(false)}
        title="Add module"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModuleModal(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={addModule}>Add module</button>
          </>
        }
      >
        <FormField label="Module title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="e.g. Module 4: VPC & Networking" required />
      </Modal>

      <Modal
        open={!!lessonModal}
        onClose={() => setLessonModal(null)}
        title="Add lesson"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setLessonModal(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={addLesson}>Add lesson</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Lesson title" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} required />
          <SelectField
            label="Lesson type"
            value={newLesson.type}
            onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value as LessonType })}
            options={[
              { value: 'video', label: 'Video' },
              { value: 'pdf', label: 'PDF' },
              { value: 'resource', label: 'Resource' },
              { value: 'live', label: 'Live session' },
              { value: 'quiz', label: 'Quiz' },
              { value: 'assignment', label: 'Assignment' },
            ]}
          />
          <FormField label="Duration" value={newLesson.duration} onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })} />
          {(newLesson.type === 'video' || newLesson.type === 'pdf' || newLesson.type === 'resource') && (
            <FileUploadList types={[newLesson.type === 'video' ? 'video' : newLesson.type === 'pdf' ? 'pdf' : 'resource']} />
          )}
        </div>
      </Modal>
    </div>
  )
}
