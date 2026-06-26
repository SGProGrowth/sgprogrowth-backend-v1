interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

export function ProgressBar({ value, size = 'md', showLabel = false, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={className}>
      <div className={`w-full rounded-full bg-stone-100 ${sizeStyles[size]}`}>
        <div
          className={`rounded-full bg-forest-700 transition-all duration-500 ${sizeStyles[size]}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="mt-1 block text-xs font-semibold text-forest-800">{clamped}%</span>
      )}
    </div>
  )
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
}

export function CircularProgress({ value, size = 64, strokeWidth = 5, label }: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f5f5f4"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#065f46"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-sm font-bold text-ink">{clamped}%</span>
        {label && <span className="text-[9px] font-medium text-ink-3 uppercase tracking-wide">{label}</span>}
      </div>
    </div>
  )
}
