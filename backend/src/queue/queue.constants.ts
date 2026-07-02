export const QUEUE_MAIL = 'mail'
export const QUEUE_CERTIFICATES = 'certificates'
export const QUEUE_BATCH_IMPORT = 'batch-import'
export const QUEUE_ANALYTICS = 'analytics'
export const QUEUE_NOTIFICATIONS = 'notifications'
export const QUEUE_CLEANUP = 'cleanup'

export const ALL_QUEUES = [
  QUEUE_MAIL,
  QUEUE_CERTIFICATES,
  QUEUE_BATCH_IMPORT,
  QUEUE_ANALYTICS,
  QUEUE_NOTIFICATIONS,
  QUEUE_CLEANUP,
] as const
