import { Link } from 'react-router-dom'
import type { Notification, NotificationType } from '../../data/studentData'

const typeConfig: Record<NotificationType, { icon: string; bg: string }> = {
  course: { icon: '📚', bg: 'bg-blue-50' },
  announcement: { icon: '📢', bg: 'bg-violet-50' },
  deadline: { icon: '⏰', bg: 'bg-red-50' },
  coaching: { icon: '💬', bg: 'bg-gold-50' },
  achievement: { icon: '🏆', bg: 'bg-forest-50' },
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const config = typeConfig[notification.type]

  return (
    <div
      className={`flex gap-4 rounded-xl border p-4 md:p-5 transition-colors ${
        notification.read
          ? 'border-stone-200 bg-white'
          : 'border-forest-200 bg-forest-50/30'
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg} text-lg`}>
        <span aria-hidden="true">{config.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-sm font-semibold ${notification.read ? 'text-ink-2' : 'text-ink'}`}>
            {notification.title}
          </h3>
          {!notification.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forest-600" aria-label="Unread" />
          )}
        </div>
        <p className="mt-1 text-sm text-ink-3">{notification.message}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-ink-4">{notification.time}</span>
          {notification.actionHref && notification.actionLabel && (
            <Link to={notification.actionHref} className="text-xs font-semibold text-forest-800 hover:text-forest-900">
              {notification.actionLabel} →
            </Link>
          )}
          {!notification.read && onMarkRead && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              className="text-xs font-semibold text-ink-3 hover:text-ink-2"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
