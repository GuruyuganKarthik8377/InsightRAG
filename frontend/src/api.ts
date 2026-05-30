import type { Citation, RetrievalResult } from './types'

const API_BASE = 'http://localhost:8001'

// ---------------------------------------------------------------------------
// Backend response types (strict — matches POST /answer contract)
// ---------------------------------------------------------------------------
export interface BackendResult {
  text: string
  score: number
  source: string
  page: number | null
  chunk_id: string
}

export interface BackendCitation {
  source: string
  page: number | null
  chunk_id: string
}

export interface AnswerResponse {
  query: string
  answer: string
  confidence: number
  citations: BackendCitation[]
  results: BackendResult[]
}

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','in','on','at','to','for','from','by','with',
  'is','are','was','were','be','been','being','this','that','these','those','it','as',
  'its','their','they','them','our','your','his','her','i','we','you','he','she',
  'do','does','did','can','could','should','would','will','may','might','also','than',
  'about','into','over','under','any','some','no','not','if','then','so','such','more',
])

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,}/g) ?? []).filter(
    (t) => !STOPWORDS.has(t) && t.length > 2,
  )
}

/** Build candidate phrases (1- to 4-grams) from text, longest first. */
function candidatePhrases(text: string): string[] {
  if (!text) return []
  const cleaned = text.replace(/[\[\]\(\)`*_]/g, ' ')
  const words = cleaned.split(/\s+/).filter(Boolean)
  const phrases: string[] = []
  for (const n of [4, 3, 2, 1]) {
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n)
      const tokens = tokenize(slice.join(' '))
      if (tokens.length < Math.min(n, 1)) continue
      const phrase = slice.join(' ').replace(/[.,;:!?"']+$/g, '').trim()
      if (phrase.length >= 3) phrases.push(phrase)
    }
  }
  return phrases
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Pick the longest phrase that appears in ``text`` from the candidate list
 * (phrases derived from the LLM answer). Falls back to query keyword, then
 * to a sentence containing any query word.
 */
export function extractHighlight(
  text: string,
  query: string,
  answer?: string,
): string {
  if (!text) return ''
  const lowerText = text.toLowerCase()

  if (answer) {
    for (const phrase of candidatePhrases(answer)) {
      if (phrase.length < 3) continue
      if (lowerText.includes(phrase.toLowerCase())) {
        return phrase.slice(0, 200)
      }
    }
  }

  const qWords = tokenize(query)
  for (const w of qWords) {
    const idx = lowerText.indexOf(w)
    if (idx >= 0) return text.slice(idx, idx + Math.max(w.length, 60)).trim().slice(0, 200)
  }

  const sentences = text.split(/[.!?]/)
  const fallback = sentences.find((s) => qWords.some((w) => s.toLowerCase().includes(w)))
  return ((fallback?.trim() ?? text.slice(0, 150))).slice(0, 200)
}

export function mapResults(
  results: BackendResult[],
  query: string,
  answer?: string,
): RetrievalResult[] {
  return (results ?? []).map((r) => ({
    id: r.chunk_id,
    documentName: r.source,
    chunkId: r.chunk_id,
    score: r.score,
    snippet: (r.text ?? '').slice(0, 300),
    highlight: extractHighlight(r.text ?? '', query, answer),
  }))
}

export function mapCitations(
  citations: BackendCitation[],
  results: BackendResult[],
): Citation[] {
  const textByChunk = new Map<string, string>()
  for (const r of results ?? []) textByChunk.set(r.chunk_id, r.text ?? '')

  return (citations ?? []).map((c, i) => ({
    id: `c-${Date.now()}-${i}-${c.chunk_id}`,
    documentName: c.source,
    page: c.page ?? null,
    preview: (textByChunk.get(c.chunk_id) ?? '').slice(0, 220),
  }))
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------
export interface DocumentSummary {
  doc_id: string | null
  filename: string | null
  num_pages: number
  num_chunks: number
  fields: Record<string, { value: string; page: number | null }>
}

export async function fetchDocument(): Promise<DocumentSummary> {
  const res = await fetch(`${API_BASE}/document`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as DocumentSummary
}

export async function fetchAnswer(query: string): Promise<AnswerResponse> {
  const res = await fetch(`${API_BASE}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'API error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return (await res.json()) as AnswerResponse
}

export async function uploadDocument(
  file: File,
  onProgress: (p: number) => void,
): Promise<unknown> {
  onProgress(10)
  const formData = new FormData()
  formData.append('file', file)
  onProgress(30)

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    })

    onProgress(80)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }

    onProgress(100)
    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Cannot connect to backend. Is the server running on port 8000?')
    }
    throw err
  }
}
