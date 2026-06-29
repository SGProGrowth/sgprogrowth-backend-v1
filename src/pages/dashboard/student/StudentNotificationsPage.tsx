import { useEffect, useState } from 'react'
import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { NotificationItem } from '../../../components/student/NotificationItem'
import { PageIntro, TabBar } from '../../../components/student/Panel'

export function StudentNotificationsPage() {
  const { workspace } = useStudentDashboard()
  const [items, setItems] = useState(workspace?.notifications ?? [])
  const [tab, setTab] = useState('all')

  useEffect(() => {
    setItems(workspace?.notifications ?? [])
  }, [workspace])

  const unread = items.filter((n) => !n.read)
  const read = items.filter((n) => n.read)

  const tabs = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'unread', label: 'Unread', count: unread.length },
    { id: 'read', label: 'Read', count: read.length },
  ]

  const displayed = tab === 'unread' ? unread : tab === 'read' ? read : items

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Stay informed"
        title="Notifications"
        description="Course updates, coaching reminders, assignment deadlines, and platform announcements."
        action={
          unread.length > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-sm font-semibold text-forest-800 hover:text-forest-900"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="space-y-3">
        {displayed.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onMarkRead={markRead} />
        ))}
      </div>
    </div>
  )
}
