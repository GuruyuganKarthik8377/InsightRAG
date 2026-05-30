import { create } from 'zustand'
import type { Citation, DocumentItem, Message, RetrievalResult } from './types'

export type NavKey = 'dashboard' | 'documents' | 'retrieval' | 'settings'

export interface ExtractedFieldEntry {
  value: string
  page: number | null
}

interface State {
  activeNav: NavKey
  messages: Message[]
  documents: DocumentItem[]
  retrievalResults: RetrievalResult[]
  citations: Citation[]
  isLoading: boolean
  expandedCitationId: string | null
  indexReady: boolean
  activeFilename: string | null
  extractedFields: Record<string, ExtractedFieldEntry>
  uploadError: string | null

  setActiveNav: (k: NavKey) => void
  addMessage: (m: Message) => void
  replaceLastAssistant: (content: string, confidence?: number) => void
  setLoading: (b: boolean) => void
  setRetrievalResults: (r: RetrievalResult[]) => void
  setCitations: (c: Citation[]) => void
  addDocument: (d: DocumentItem) => void
  updateDocument: (id: string, patch: Partial<DocumentItem>) => void
  removeDocument: (id: string) => void
  toggleCitation: (id: string) => void
  setIndexReady: (
    ready: boolean,
    info?: { filename?: string | null; fields?: Record<string, ExtractedFieldEntry> },
  ) => void
  setUploadError: (msg: string | null) => void
}

const initialDocs: DocumentItem[] = [
  { id: 'd1', name: 'Annual_Report_2024.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: Date.now() - 86400000, status: 'ready' },
  { id: 'd2', name: 'Product_Specs.docx', type: 'DOCX', size: '845 KB', uploadedAt: Date.now() - 3600000, status: 'ready' },
  { id: 'd3', name: 'meeting_notes.txt', type: 'TXT', size: '32 KB', uploadedAt: Date.now() - 600000, status: 'ready' },
]

export const useStore = create<State>((set) => ({
  activeNav: 'dashboard',
  messages: [],
  documents: initialDocs,
  retrievalResults: [],
  citations: [],
  isLoading: false,
  expandedCitationId: null,
  indexReady: false,
  activeFilename: null,
  extractedFields: {},
  uploadError: null,

  setIndexReady: (ready, info) =>
    set({
      indexReady: ready,
      activeFilename: ready ? info?.filename ?? null : null,
      extractedFields: ready ? info?.fields ?? {} : {},
    }),

  setUploadError: (msg) => set({ uploadError: msg }),

  setActiveNav: (k) => set({ activeNav: k }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  replaceLastAssistant: (content, confidence) =>
    set((s) => {
      const msgs = [...s.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content, confidence }
          break
        }
      }
      return { messages: msgs }
    }),
  setLoading: (b) => set({ isLoading: b }),
  setRetrievalResults: (r) => set({ retrievalResults: r }),
  setCitations: (c) => set({ citations: c }),
  addDocument: (d) => set((s) => ({ documents: [d, ...s.documents] })),
  updateDocument: (id, patch) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  toggleCitation: (id) =>
    set((s) => ({ expandedCitationId: s.expandedCitationId === id ? null : id })),
}))
