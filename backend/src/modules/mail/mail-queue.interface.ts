import { SendMailOptions } from './mail.service'

export interface MailJob {
  id: string
  options: SendMailOptions
  createdAt: Date
}

/** Abstraction for future BullMQ / Redis queue integration. */
export interface MailQueue {
  enqueue(options: SendMailOptions): Promise<void>
}

export const MAIL_QUEUE = Symbol('MAIL_QUEUE')
