import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'
import { useStore } from '../store'
import { uploadDocument } from '../api'
import type { DocumentItem } from '../types'

interface UploadResult {
  status?: string
  filename?: string
  num_chunks?: number
  extracted_fields?: Record<string, { value: string; page: number | null }>
}

const ACCEPTED = ['pdf', 'docx', 'txt']

function getType(name: string): DocumentItem['type'] | null {
  const ext = name.split('.').pop()?.toLowerCase()
  if (!ext) return null
  if (ext === 'pdf') return 'PDF'
  if (ext === 'docx') return 'DOCX'
  if (ext === 'txt') return 'TXT'
  return null
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadBox() {
  const {
    documents,
    addDocument,
    updateDocument,
    removeDocument,
    setIndexReady,
    setUploadError,
  } = useStore()
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const f of Array.from(files)) {
      const t = getType(f.name)
      if (!t) continue
      const id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const doc: DocumentItem = {
        id,
        name: f.name,
        type: t,
        size: fmtSize(f.size),
        uploadedAt: Date.now(),
        status: 'uploading',
        progress: 0,
      }
      addDocument(doc)
      setUploadError(null)
      const startedAt = Date.now()
      // Tick once a second so the elapsed-time UI updates while we wait.
      const ticker = window.setInterval(() => {
        updateDocument(id, { progress: Math.floor((Date.now() - startedAt) / 1000) })
      }, 1000)
      try {
        const res = (await uploadDocument(f, () => {
          /* progress is now driven by elapsed time; ignore stage callbacks */
        })) as UploadResult
        window.clearInterval(ticker)
        updateDocument(id, { status: 'ready', progress: 100 })
        setIndexReady(true, {
          filename: res?.filename ?? f.name,
          fields: res?.extracted_fields ?? {},
        })
        setUploadError(null)
      } catch (err) {
        window.clearInterval(ticker)
        updateDocument(id, { status: 'error', progress: 100 })
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setUploadError(`${f.name}: ${msg}`)
        // NOTE: we deliberately do NOT touch indexReady here — a failed
        // upload should leave any previously-good document still queryable.
        console.error('Upload failed:', err)
      }
    }
  }

  const recent = documents.slice(0, 3)

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border border-dashed p-4 text-center transition-colors ${
          drag ? 'border-accent bg-accent/10' : 'border-white/15 bg-white/5 hover:bg-white/10'
        }`}
      >
        <div className="mx-auto w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <UploadCloud size={18} className="text-accent" />
        </div>
        <div className="mt-2 text-sm text-white font-medium">Drop files or click</div>
        <div className="text-[11px] text-slate-400">Max 20MB per file</div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {ACCEPTED.map((e) => (
            <span
              key={e}
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/5"
            >
              {e}
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {recent.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {recent.map((d) => (
            <li
              key={d.id}
              className="group flex items-center gap-2 rounded-lg bg-white/5 border border-white/5 px-2.5 py-2"
            >
              <FileText size={14} className="text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white truncate">{d.name}</div>
                {d.status === 'uploading' ? (
                  <>
                    <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 w-1/3 bg-accent rounded-full animate-[upload-slide_1.4s_ease-in-out_infinite]" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Indexing… {d.progress ?? 0}s elapsed (large PDFs can take several minutes)
                    </div>
                  </>
                ) : d.status === 'error' ? (
                  <div className="text-[10px] text-rose-300">Upload failed</div>
                ) : (
                  <div className="text-[10px] text-slate-400">{d.size}</div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeDocument(d.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
