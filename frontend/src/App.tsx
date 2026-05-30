import { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import RetrievalPanel from './components/RetrievalPanel'
import CitationPanel from './components/CitationPanel'
import { fetchDocument } from './api'
import { useStore } from './store'

export default function App() {
  const setIndexReady = useStore((s) => s.setIndexReady)

  useEffect(() => {
    let cancelled = false
    fetchDocument()
      .then((d) => {
        if (cancelled) return
        if (d && d.doc_id && d.num_chunks > 0) {
          setIndexReady(true, { filename: d.filename, fields: d.fields })
        } else {
          setIndexReady(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIndexReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [setIndexReady])

  return (
    <div className="h-screen w-screen flex bg-canvas overflow-hidden text-ink">
      <Sidebar />
      <ChatWindow />
      <aside className="w-[320px] shrink-0 h-full border-l border-slate-200 bg-canvas overflow-y-auto scrollbar-thin px-5 py-5">
        <RetrievalPanel />
        <CitationPanel />
      </aside>
    </div>
  )
}
