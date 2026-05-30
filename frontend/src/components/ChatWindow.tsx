import { Search, Sparkle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '../store'
import { fetchAnswer, mapCitations, mapResults } from '../api'
import MessageBubble from './MessageBubble'
import InputBox from './InputBox'
import type { Message } from '../types'

export default function ChatWindow() {
  const {
    messages,
    addMessage,
    setRetrievalResults,
    setCitations,
    isLoading,
    setLoading,
    replaceLastAssistant,
    indexReady,
    activeFilename,
    uploadError,
    setUploadError,
  } = useStore()

  const [filter, setFilter] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastQueryRef = useRef<string>('')

  const chat = useMutation({
    mutationFn: async (q: string) => {
      const data = await fetchAnswer(q)
      const answer =
        data.answer && data.answer.trim().length > 0 ? data.answer : "I don't know"
      return {
        answer,
        confidence: typeof data.confidence === 'number' ? data.confidence : 0,
        retrieval: mapResults(data.results, q, answer),
        citations: mapCitations(data.citations, data.results),
      }
    },
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      replaceLastAssistant(data.answer, data.confidence)
      setRetrievalResults(data.retrieval)
      setCitations(data.citations)
      setLoading(false)
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error && err.message
          ? `Error fetching response: ${err.message}`
          : 'Error fetching response'
      replaceLastAssistant(msg, 0)
      setRetrievalResults([])
      setCitations([])
      setLoading(false)
    },
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (q: string) => {
    lastQueryRef.current = q
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: q, createdAt: Date.now() }
    const assistantPlaceholder: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }
    addMessage(userMsg)
    addMessage(assistantPlaceholder)
    chat.mutate(q)
  }

  const handleRegenerate = () => {
    if (!lastQueryRef.current) return
    const placeholder: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }
    addMessage(placeholder)
    chat.mutate(lastQueryRef.current)
  }

  const visibleMessages = filter
    ? messages.filter((m) => m.content.toLowerCase().includes(filter.toLowerCase()))
    : messages

  return (
    <section className="flex-1 flex flex-col h-full bg-canvas min-w-0">
      {/* Top search bar */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-soft px-3.5 py-2.5">
            <Search size={16} className="text-ink-muted" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search conversations, documents, insights…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-muted"
            />
            <kbd className="hidden md:inline-flex text-[10px] text-ink-muted border border-slate-200 rounded-md px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
          <button className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 shadow-soft text-sm text-ink-muted hover:text-ink transition-colors">
            Filters
          </button>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-soft">
            <Sparkle size={16} />
          </div>
        </div>
      </div>

      {/* Chat scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-2">
        {visibleMessages.length === 0 && !isLoading && <EmptyState onPick={handleSubmit} />}

        <div className="max-w-3xl mx-auto space-y-5 py-2">
          {visibleMessages.map((m, idx) => {
            const isLastAssistant =
              m.role === 'assistant' && idx === visibleMessages.length - 1 && m.content !== ''
            if (m.role === 'assistant' && m.content === '' && isLoading) {
              return <TypingBubble key={m.id} />
            }
            return (
              <MessageBubble
                key={m.id}
                message={m}
                onRegenerate={isLastAssistant ? handleRegenerate : undefined}
              />
            )
          })}
        </div>
      </div>

      {uploadError && (
        <div className="mx-6 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] text-rose-800 flex items-start justify-between gap-3">
          <div>
            <strong className="font-semibold">Upload failed.</strong>{' '}
            <span className="break-words">{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-600 hover:text-rose-900 text-[11px] font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
      {!indexReady && !uploadError && (
        <div className="mx-6 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800">
          <strong className="font-semibold">No document indexed.</strong>{' '}
          Upload a PDF, DOCX, or TXT file in the left panel to enable querying.
        </div>
      )}
      {indexReady && activeFilename && (
        <div className="mx-6 mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[12px] text-emerald-800">
          Active document: <strong className="font-semibold">{activeFilename}</strong>
        </div>
      )}
      <InputBox onSubmit={handleSubmit} disabled={isLoading || !indexReady} />
    </section>
  )
}

function TypingBubble() {
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0">
        <Sparkle size={15} />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200/70 px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5">
          <span className="dot w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="dot w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="dot w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[12px] text-ink-muted ml-2">Retrieving sources…</span>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    'Summarize the latest annual report',
    'What are the product spec highlights?',
    'List action items from recent meeting notes',
    'Compare compliance policies across versions',
  ]
  return (
    <div className="max-w-2xl mx-auto pt-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-card">
        <Sparkle size={22} />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-ink">How can I help you today?</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Ask questions across your indexed documents. Answers include citations and retrieval scores.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left text-sm rounded-xl bg-white border border-slate-200 px-3.5 py-3 shadow-soft hover:border-primary/40 hover:shadow-card transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
