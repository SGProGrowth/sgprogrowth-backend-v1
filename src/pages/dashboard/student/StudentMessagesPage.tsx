import { useEffect, useState } from 'react'
import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { PageIntro, TabBar, EmptyState } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/instructor/Modal'
import { TextAreaField, FormField } from '../../../components/instructor/FormField'
import { SuccessBanner } from '../../../components/instructor/Modal'
import { SplitInbox } from '../../../components/ui/SplitInbox'
import { useIsDesktop } from '../../../hooks/useBreakpoint'

export function StudentMessagesPage() {
  const { workspace } = useStudentDashboard()
  const isDesktop = useIsDesktop()
  const [tab, setTab] = useState('inbox')
  const [messages, setMessages] = useState(workspace?.messages ?? [])
  const [selected, setSelected] = useState<typeof messages[0] | null>(null)

  useEffect(() => {
    setMessages(workspace?.messages ?? [])
    setSelected(workspace?.messages[0] ?? null)
  }, [workspace])
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const unread = messages.filter((m) => !m.read)

  const tabs = [
    { id: 'inbox', label: 'Inbox', count: messages.length },
    { id: 'unread', label: 'Unread', count: unread.length },
  ]

  const displayed = tab === 'unread' ? unread : messages

  const openMessage = (msg: typeof messages[0]) => {
    setSelected(msg)
    if (!msg.read) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)))
    }
    if (!isDesktop) setMobileShowDetail(true)
  }

  const sendMessage = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowCompose(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const listPanel = displayed.length === 0 ? (
    <EmptyState title="No messages" description="Your inbox is empty." />
  ) : (
    <ul className="divide-y divide-stone-100 max-h-[60vh] overflow-y-auto scroll-touch lg:max-h-none">
      {displayed.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => openMessage(m)}
            className={`w-full min-h-[72px] px-4 py-4 text-left transition-colors hover:bg-stone-50 active:bg-stone-100 ${
              selected?.id === m.id ? 'bg-forest-50/50 border-l-2 border-l-forest-700' : ''
            } ${!m.read ? 'bg-forest-50/20' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-semibold ${m.read ? 'text-ink-2' : 'text-ink'}`}>{m.from}</p>
              {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-forest-600 mt-1.5" />}
            </div>
            <p className={`text-sm mt-0.5 truncate ${m.read ? 'text-ink-3' : 'text-ink font-medium'}`}>{m.subject}</p>
            <p className="text-xs text-ink-4 mt-1 truncate">{m.preview}</p>
            <p className="text-[10px] text-ink-4 mt-1">{m.time}</p>
          </button>
        </li>
      ))}
    </ul>
  )

  const detailPanel = selected ? (
    <div className="flex h-full min-h-[360px] flex-col lg:min-h-[480px]">
      <div className="border-b border-stone-100 px-4 py-4 sm:px-6">
        <h2 className="font-display text-base font-bold text-ink sm:text-lg">{selected.subject}</h2>
        <p className="text-sm text-ink-3 mt-1 break-words">
          {selected.from} · {selected.role}
          {selected.courseTitle ? ` · ${selected.courseTitle}` : ''}
        </p>
        <p className="text-xs text-ink-4 mt-1">{selected.time}</p>
      </div>
      <div className="flex-1 overflow-y-auto scroll-touch px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-sm text-ink-2 leading-relaxed">{selected.body}</p>
      </div>
      <div className="border-t border-stone-100 px-4 py-4 flex flex-col gap-2 sm:flex-row sm:gap-2 sm:px-6 safe-bottom">
        <Button variant="primary" size="sm" className="w-full sm:w-auto">Reply</Button>
        <Button variant="secondary" size="sm" className="w-full sm:w-auto">Forward</Button>
      </div>
    </div>
  ) : null

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Communications"
        title="Messages"
        description="Direct conversations with your instructors and coaches."
        action={<Button variant="primary" size="md" onClick={() => setShowCompose(true)}>New message</Button>}
      />

      {saved && <SuccessBanner message="Message sent successfully." onDismiss={() => setSaved(false)} />}

      <TabBar tabs={tabs} active={tab} onChange={(id) => { setTab(id); setMobileShowDetail(false) }} />

      <SplitInbox
        list={listPanel}
        detail={detailPanel}
        mobileShowDetail={mobileShowDetail}
        onMobileBack={() => setMobileShowDetail(false)}
      />

      {unread.length > 0 && tab === 'inbox' && (
        <p className="mt-4 text-xs text-ink-3">{unread.length} unread message(s)</p>
      )}

      <Modal
        open={showCompose}
        onClose={() => setShowCompose(false)}
        title="New message"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setShowCompose(false)} disabled={loading}>Cancel</button>
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={sendMessage} disabled={loading}>
              {loading ? 'Sending…' : 'Send message'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="To" placeholder="Instructor name" defaultValue={workspace?.courses[0]?.coach ?? ''} required />
          <FormField label="Subject" placeholder="Message subject" required />
          <TextAreaField label="Message" placeholder="Write your message…" rows={6} required />
        </div>
      </Modal>
    </div>
  )
}
