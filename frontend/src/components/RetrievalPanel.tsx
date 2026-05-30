import { FileText, TrendingUp } from 'lucide-react'
import { useStore } from '../store'

function scoreColor(s: number) {
  if (s >= 0.9) return 'bg-accent/15 text-emerald-700 border-accent/30'
  if (s >= 0.8) return 'bg-primary/10 text-primary-700 border-primary/20'
  return 'bg-amber-100 text-amber-700 border-amber-200'
}

function highlight(text: string, term: string) {
  if (!term) return text
  const parts = text.split(new RegExp(`(${term})`, 'ig'))
  return parts.map((p, i) =>
    p.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="rounded px-0.5 bg-primary/15 text-primary-700 font-medium">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

export default function RetrievalPanel() {
  const { retrievalResults, isLoading } = useStore()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp size={14} />
          </div>
          <h3 className="text-sm font-semibold text-ink">Retrieval Results</h3>
        </div>
        <span className="text-[11px] text-ink-muted">Top {retrievalResults.length || 5}</span>
      </div>

      {isLoading && retrievalResults.length === 0 && <RetrievalSkeleton />}

      {!isLoading && retrievalResults.length === 0 && (
        <div className="text-xs text-ink-muted bg-white border border-dashed border-slate-200 rounded-xl p-4 text-center">
          Ask a question to see retrieval results.
        </div>
      )}

      <ul className="space-y-2.5">
        {retrievalResults.map((r) => (
          <li
            key={r.id}
            className="rounded-xl bg-white border border-slate-200 shadow-soft p-3 hover:shadow-card hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-ink-muted shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{r.documentName}</div>
                  <div className="text-[11px] text-ink-muted">{r.chunkId}</div>
                </div>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${scoreColor(r.score)}`}
              >
                {r.score.toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-[12.5px] text-ink/90 leading-relaxed line-clamp-3">
              {highlight(r.snippet, r.highlight)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RetrievalSkeleton() {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="rounded-xl bg-white border border-slate-200 p-3">
          <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
          <div className="mt-2 h-2 w-1/3 bg-slate-200 rounded animate-pulse" />
          <div className="mt-3 h-2 w-full bg-slate-100 rounded animate-pulse" />
          <div className="mt-1.5 h-2 w-5/6 bg-slate-100 rounded animate-pulse" />
        </li>
      ))}
    </ul>
  )
}
