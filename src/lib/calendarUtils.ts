/** Shared calendar helpers for dashboard schedule views. */

export interface MonthView {
  year: number
  month: number // 0-indexed
}

export function monthKey({ year, month }: MonthView): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function formatMonthYear({ year, month }: MonthView): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function getMonthGrid({ year, month }: MonthView) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  return { daysInMonth, startOffset }
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  }
}

export function formatIsoDate(iso: string): string {
  const parsed = parseIsoDate(iso)
  if (!parsed) return iso
  return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function eventMatchesMonth(iso: string, view: MonthView): boolean {
  const parsed = parseIsoDate(iso)
  if (!parsed) return false
  return parsed.year === view.year && parsed.month === view.month
}

export function eventDayOfMonth(iso: string): number | null {
  return parseIsoDate(iso)?.day ?? null
}

export function shiftMonth(view: MonthView, delta: number): MonthView {
  const d = new Date(view.year, view.month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function currentMonthView(): MonthView {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function defaultSelectedDay(view: MonthView): number | null {
  const now = new Date()
  if (now.getFullYear() === view.year && now.getMonth() === view.month) {
    return now.getDate()
  }
  return null
}

export function eventsThisWeek<T extends { date: string }>(events: T[]): T[] {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + mondayOffset)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return events.filter((e) => {
    const parsed = parseIsoDate(e.date)
    if (!parsed) return false
    const d = new Date(parsed.year, parsed.month, parsed.day)
    return d >= start && d < end
  })
}
