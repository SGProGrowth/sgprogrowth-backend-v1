interface StatCardProps {
  label: string
  value: string
  change: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ label, value, change, trend = 'neutral' }: StatCardProps) {
  const trendColor =
    trend === 'up' ? 'text-forest-700' : trend === 'down' ? 'text-red-600' : 'text-ink-3'

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 transition-shadow hover:shadow-[0_4px_24px_-4px_rgba(10,10,10,0.06)]">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-3">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className={`mt-1.5 text-sm ${trendColor}`}>{change}</p>
    </div>
  )
}
