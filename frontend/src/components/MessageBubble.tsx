import { Copy, RefreshCw, Check, Sparkle, User } from 'lucide-react'
import { useState } from 'react'
import type { Message } from '../types'

interface Props {
  message: Message
  onRegenerate?: () => void
}

function renderRich(content: string) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flush = () => {
    if (!list) return
    const Tag = list.type
    blocks.push(
      <Tag
        key={`l-${blocks.length}`}
        className={`my-2 pl-5 space-y-1 ${list.type === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-primary`}
      >
        {list.items.map((it, i) => (
          <li key={i} className="text-[14px] text-ink leading-relaxed">
            {renderInline(it)}
          </li>
        ))}
      </Tag>,
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^\s*[-*]\s+/.test(line)) {
      const txt = line.replace(/^\s*[-*]\s+/, '')
      if (!list || list.type !== 'ul') {
        flush()
        list = { type: 'ul', items: [] }
      }
      list.items.push(txt)
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const txt = line.replace(/^\s*\d+\.\s+/, '')
      if (!list || list.type !== 'ol') {
        flush()
        list = { type: 'ol', items: [] }
      }
      list.items.push(txt)
    } else if (line.trim() === '') {
      flush()
    } else {
      flush()
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-[14px] text-ink leading-relaxed">
          {renderInline(line)}
        </p>,
      )
    }
  }
  flush()
  return blocks
}

function renderInline(text: string): React.ReactNode {
  // Highlights: ==word== ; bold: **word**
  const out: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|==[^=]+==)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = regex.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      out.push(
        <strong key={i++} className="font-semibold text-ink">
          {tok.slice(2, -2)}
        </strong>,
      )
    } else {
      out.push(
        <mark
          key={i++}
          className="rounded px-1 py-0.5 bg-primary/10 text-primary-700 font-medium"
        >
          {tok.slice(2, -2)}
        </mark>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function MessageBubble({ message, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-primary-700 text-white px-4 py-2.5 shadow-soft">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-ink/90 text-white flex items-center justify-center shrink-0">
          <User size={15} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0">
        <Sparkle size={15} />
      </div>
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200/70 px-4 py-3 shadow-soft">
          {renderRich(message.content)}
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={copy}
            className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <RefreshCw size={12} />
              Regenerate
            </button>
          )}
          {typeof message.confidence === 'number' && message.confidence > 0 && (
            <span
              title="Answer confidence (top-chunk rerank score)"
              className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                message.confidence >= 0.85
                  ? 'bg-accent/15 text-emerald-700 border-accent/30'
                  : message.confidence >= 0.6
                  ? 'bg-primary/10 text-primary-700 border-primary/20'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}
            >
              confidence {(message.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
