import { useState } from 'react'

interface UploadZoneProps {
  label: string
  hint?: string
  accept?: string
  preview?: string
  aspect?: 'square' | 'banner'
  onUpload?: (file: File) => void
}

export function UploadZone({ label, hint, accept = 'image/*', preview, aspect = 'square', onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const handleFile = (file: File) => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setDone(true)
      onUpload?.(file)
    }, 1200)
  }

  const heightClass = aspect === 'banner' ? 'h-36' : 'h-32'

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">{label}</p>
      <div
        className={`relative flex ${heightClass} cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          dragging ? 'border-forest-600 bg-forest-50' : 'border-stone-300 bg-stone-50/50 hover:border-stone-400'
        } ${preview ? 'overflow-hidden p-0' : 'p-4'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {preview && (
          <div className={`absolute inset-0 bg-gradient-to-br from-forest-800 to-forest-900 flex items-end p-3`}>
            <span className="text-xs font-semibold text-white/80">{preview}</span>
          </div>
        )}
        {!preview && (
          <>
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-forest-700" />
                <p className="text-xs text-ink-3">Uploading…</p>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center gap-1 text-forest-700">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-semibold">Upload complete</p>
              </div>
            ) : (
              <>
                <svg className="h-8 w-8 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="mt-2 text-sm font-medium text-ink-2">Drop file or click to upload</p>
                <p className="text-xs text-ink-4">PNG, JPG up to 5MB</p>
              </>
            )}
          </>
        )}
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

export function FileUploadList({ types }: { types: ('video' | 'pdf' | 'resource')[] }) {
  const labels = { video: 'Video', pdf: 'PDF Document', resource: 'Resource File' }
  const accepts = { video: 'video/*', pdf: '.pdf', resource: '.zip,.pdf,.doc,.docx' }

  return (
    <div className="space-y-3">
      {types.map((type) => (
        <UploadZone key={type} label={`Upload ${labels[type]}`} accept={accepts[type]} hint={`Supported formats will be validated on upload.`} />
      ))}
    </div>
  )
}
