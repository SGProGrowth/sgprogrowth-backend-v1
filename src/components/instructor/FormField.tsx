import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  required?: boolean
}

export function FormField({ label, hint, error, required, className = '', id, ...props }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={fieldId}
        className={`input-field w-full ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      />
      {hint && !error && <p id={`${fieldId}-hint`} className="mt-1 text-xs text-ink-3">{hint}</p>}
      {error && <p id={`${fieldId}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  required?: boolean
}

export function TextAreaField({ label, hint, error, required, className = '', id, rows = 4, ...props }: TextAreaFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        className={`input-field w-full resize-y py-3 ${error ? 'border-red-400' : ''} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  options: { value: string; label: string }[]
  hint?: string
  error?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
  id?: string
  name?: string
  disabled?: boolean
}

export function SelectField({ label, options, hint, error, className = '', id, value, onChange, ...props }: SelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <select id={fieldId} className={`input-field w-full ${className}`} value={value} onChange={onChange} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface ToggleFieldProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-100 px-4 py-3 hover:bg-stone-50">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="text-xs text-ink-3 mt-0.5">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-stone-300 text-forest-700 focus:ring-forest-600"
      />
    </label>
  )
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}
