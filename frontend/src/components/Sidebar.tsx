import { LayoutDashboard, FileText, Sparkles, Settings, Sparkle, type LucideIcon } from 'lucide-react'
import { useStore, type NavKey } from '../store'
import UploadBox from './UploadBox'

const items: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'retrieval', label: 'Retrieval Insights', icon: Sparkles },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { activeNav, setActiveNav, documents } = useStore()

  const usedMb = documents.length * 1.2 + 4.6
  const totalMb = 20
  const pct = Math.min(100, (usedMb / totalMb) * 100)

  return (
    <aside className="w-[260px] shrink-0 bg-sidebar text-slate-200 flex flex-col h-full scrollbar-dark">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
          <Sparkle size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-white">InsightRAG</div>
          <div className="text-[11px] text-slate-400 -mt-0.5">Pro</div>
        </div>
      </div>

      <nav className="px-3 mt-2 space-y-1">
        {items.map((it) => {
          const Icon = it.icon
          const active = activeNav === it.key
          return (
            <button
              key={it.key}
              onClick={() => setActiveNav(it.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active
                  ? 'bg-gradient-to-r from-primary/30 to-primary/10 text-white shadow-inner'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
              <span className="font-medium">{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          )
        })}
      </nav>

      <div className="px-4 mt-5">
        <UploadBox />
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white/5 border border-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Storage</span>
            <span className="text-slate-200 font-medium">
              {usedMb.toFixed(1)} / {totalMb} MB
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-xl p-3.5 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 border border-white/10">
          <div className="text-xs uppercase tracking-wide text-accent font-semibold">Pro Plan</div>
          <div className="text-sm text-white mt-1 font-semibold">Unlimited insights</div>
          <div className="text-xs text-slate-300 mt-1">Advanced retrieval, priority compute & longer contexts.</div>
          <button className="mt-3 w-full text-xs font-semibold rounded-lg py-2 bg-white text-ink hover:bg-slate-100 transition-colors">
            Manage plan
          </button>
        </div>
      </div>
    </aside>
  )
}
