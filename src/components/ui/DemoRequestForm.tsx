import { useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import { Button } from './Button'

export function DemoRequestForm({ onClose }: { onClose?: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return
    setBusy(true)
    trackEvent('demo_request_submitted', { name, email, company })

    // mailto fallback to contact sales
    const subject = encodeURIComponent(`Demo request from ${name} (${company})`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`)
    const mailto = `mailto:sales@sgprogrowth.com?subject=${subject}&body=${body}`

    // show success message then trigger mailto
    setTimeout(() => {
      setBusy(false)
      setSent(true)
      // open mail client as the next step
      window.location.href = mailto
      if (onClose) onClose()
    }, 600)
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-slate-200 bg-surface p-4">
        <p className="font-medium text-navy-900">Thanks — request started</p>
        <p className="mt-2 text-sm text-slate-600">We've launched an email to our sales team. They'll follow up shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sr-only">Full name</label>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-500"
          required
        />
        <label className="sr-only">Work email</label>
        <input
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-500"
          type="email"
          required
        />
      </div>

      <div className="mt-3">
        <label className="sr-only">Company</label>
        <input
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-500"
        />
      </div>

      <div className="mt-3">
        <label className="sr-only">Message</label>
        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" size="md" variant="outline" disabled={busy} className="bg-white">
          {busy ? 'Sending…' : 'Request demo'}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
