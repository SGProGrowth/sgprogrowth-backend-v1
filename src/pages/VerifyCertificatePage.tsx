import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { verifyCertificatePublic, type CertificateVerification } from '../lib/api/certificates'
import { Button } from '../components/ui/Button'

export function VerifyCertificatePage() {
  const { credentialId: paramId } = useParams()
  const [input, setInput] = useState(paramId ?? '')
  const [result, setResult] = useState<CertificateVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runVerify = async (id: string) => {
    const trimmed = id.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const data = await verifyCertificatePublic(trimmed)
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void runVerify(input)
  }

  useEffect(() => {
    if (paramId) void runVerify(paramId)
  }, [paramId])

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <p className="text-label mb-2">SG Pro Growth</p>
          <h1 className="font-display text-2xl font-bold text-ink">Certificate Verification</h1>
          <p className="mt-2 text-sm text-ink-3">
            Enter a credential ID or scan a certificate QR code to verify authenticity.
          </p>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-ink mb-2" htmlFor="credentialId">
            Credential ID
          </label>
          <input
            id="credentialId"
            className="input-field w-full mb-4 font-mono text-sm"
            placeholder="SGPG-XXXXXXXXXXXXXXXX"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify certificate'}
          </Button>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {result && (
          <div
            className={`mt-6 rounded-xl border p-6 ${
              result.valid
                ? 'border-forest-200 bg-forest-50/50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                  result.valid ? 'bg-forest-700 text-white' : 'bg-stone-200 text-ink-3'
                }`}
              >
                {result.valid ? '✓' : '✕'}
              </span>
              <div>
                <p className="font-display font-bold text-ink capitalize">{result.status}</p>
                <p className="text-sm text-ink-3">
                  {result.valid ? 'This certificate is authentic.' : result.message ?? 'This certificate could not be verified.'}
                </p>
              </div>
            </div>

            {result.studentName && (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Student</dt>
                  <dd className="font-medium text-ink text-right">{result.studentName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Course</dt>
                  <dd className="font-medium text-ink text-right">{result.courseTitle}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Instructor</dt>
                  <dd className="font-medium text-ink text-right">{result.instructorName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Completed</dt>
                  <dd className="font-medium text-ink text-right">{result.completionDate}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Issued</dt>
                  <dd className="font-medium text-ink text-right">{result.issuedDate}</dd>
                </div>
                {result.certificateNumber && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-3">Certificate No.</dt>
                    <dd className="font-mono text-xs text-ink text-right">{result.certificateNumber}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
