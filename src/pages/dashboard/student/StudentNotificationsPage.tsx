import { useEffect, useState } from 'react'
import { useStudentDashboard } from '../../../contexts/DashboardWorkspaceContext'
import { NotificationItem } from '../../../components/student/NotificationItem'
import { PageIntro, TabBar, EmptyState } from '../../../components/student/Panel'
import { AlertBanner } from '../../../components/ui/AlertBanner'
import { markAllStudentNotificationsRead, markStudentNotificationRead } from '../../../lib/api/profile'

export function StudentNotificationsPage() {
  const { workspace, refresh } = useStudentDashboard()
  const [items, setItems] = useState(workspace?.notifications ?? [])
  const [tab, setTab] = useState('all')
  const [actionError, setActionError] = useState('')

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
    setActionError('')
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    void markStudentNotificationRead(id)
      .then(() => refresh())
      .catch(() => setActionError('Could not mark notification as read. Please try again.'))
  }

  const markAllRead = () => {
    setActionError('')
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    void markAllStudentNotificationsRead()
      .then(() => refresh())
      .catch(() => setActionError('Could not mark all notifications as read. Please try again.'))
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Stay informed"
        title="Notifications"
        description="Course updates, coaching reminders, assignment deadlines, and platform announcements."
        action={
          unread.length > 0 ? (
            <button type="button" onClick={markAllRead} className="action-link">
              Mark all as read
            </button>
          ) : undefined
        }
      />

      {actionError && (
        <AlertBanner variant="error" className="mb-4">
          {actionError}
        </AlertBanner>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="space-y-3">
        {displayed.length > 0 ? (
          displayed.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onMarkRead={markRead} />
          ))
        ) : (
          <EmptyState
            icon="bell"
            title={tab === 'unread' ? 'All caught up' : tab === 'read' ? 'No read notifications' : 'No notifications yet'}
            description={
              tab === 'unread'
                ? 'You have read all your notifications. New updates will appear here.'
                : 'Course updates, coaching reminders, and assignment alerts will show up here.'
            }
          />
        )}
      </div>
    </div>
  )
}
