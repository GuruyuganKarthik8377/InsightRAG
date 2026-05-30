import { Send, Paperclip, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface Props {
  onSubmit: (q: string) => void
  disabled?: boolean
}

export default function InputBox({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = value.trim()
    if (!v || disabled) return
    onSubmit(v)
    setValue('')
  }

  return (
    <form onSubmit={submit} className="px-6 pb-5 pt-3 bg-canvas">
      <div className="flex items-end gap-2 rounded-2xl bg-white border border-slate-200 shadow-card px-3 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 transition">
        <button
          type="button"
          className="p-2 rounded-lg text-ink-muted hover:bg-slate-100 transition-colors"
          aria-label="Attach"
        >
          <Paperclip size={16} />
        </button>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit(e as unknown as FormEvent)
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={
            disabled
              ? 'Upload a document to start asking questions…'
              : 'Ask anything across your documents…'
          }
          className="flex-1 resize-none bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-muted py-2 max-h-40 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          className="p-2 rounded-lg text-ink-muted hover:bg-slate-100 transition-colors"
          aria-label="Suggestions"
        >
          <Sparkles size={16} />
        </button>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center shadow-soft hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Send"
        >
          <Send size={15} />
        </button>
      </div>
      <div className="mt-2 text-[11px] text-ink-muted text-center">
        InsightRAG can make mistakes. Verify with the cited sources on the right.
      </div>
    </form>
  )
}
