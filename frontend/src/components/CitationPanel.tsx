import { BookMarked, Download, Eye, ChevronDown } from 'lucide-react'
import { useStore } from '../store'

export default function CitationPanel() {
  const { citations, expandedCitationId, toggleCitation } = useStore()

  const handleDownload = (name: string) => {
    const blob = new Blob([`Mock download for ${name}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name.replace(/\.[a-z]+$/i, '') + '_citation.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <BookMarked size={14} />
          </div>
          <h3 className="text-sm font-semibold text-ink">Citations</h3>
        </div>
        <span className="text-[11px] text-ink-muted">{citations.length}</span>
      </div>

      {citations.length === 0 && (
        <div className="text-xs text-ink-muted bg-white border border-dashed border-slate-200 rounded-xl p-4 text-center">
          Citations will appear here after a query.
        </div>
      )}

      <ul className="space-y-2.5">
        {citations.map((c) => {
          const expanded = expandedCitationId === c.id
          return (
            <li
              key={c.id}
              className="rounded-xl bg-white border border-slate-200 shadow-soft overflow-hidden hover:shadow-card hover:border-primary/30 transition-all"
            >
              <button
                onClick={() => toggleCitation(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{c.documentName}</div>
                  <div className="text-[11px] text-ink-muted">Reference</div>
                </div>
                {c.page != null && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary-700 border border-primary/15 font-semibold">
                    p. {c.page}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>

              {expanded && (
                <div className="px-3 pb-3">
                  <p className="text-[12.5px] text-ink/90 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                    {c.preview}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        alert(
                          c.page != null
                            ? `Opening preview for ${c.documentName} (page ${c.page})`
                            : `Opening preview for ${c.documentName}`,
                        )
                      }
                      className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md text-ink-muted hover:text-ink hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      onClick={() => handleDownload(c.documentName)}
                      className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md text-ink-muted hover:text-ink hover:bg-slate-100 transition-colors"
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
