export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  confidence?: number
}

export interface DocumentItem {
  id: string
  name: string
  type: 'PDF' | 'DOCX' | 'TXT'
  size: string
  uploadedAt: number
  status: 'uploading' | 'ready' | 'error'
  progress?: number
}

export interface RetrievalResult {
  id: string
  documentName: string
  chunkId: string
  score: number
  highlight: string
  snippet: string
}

export interface Citation {
  id: string
  documentName: string
  page: number | null
  preview: string
}
