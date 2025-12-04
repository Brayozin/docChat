export type ProcessingStatus =
  | 'uploading'
  | 'extracting'
  | 'indexing'
  | 'ready'
  | 'error'

export interface ProgressState {
  id: string
  fileName: string
  fileSize: number
  status: ProcessingStatus
  progress: number
  message?: string
  error?: string
  startedAt: Date
}

export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error'
  status?: ProcessingStatus
  progress?: number
  message?: string
  documentId?: string
  name?: string
  error?: string
}

export interface RAGContext {
  documentsUsed: Array<{
    id: string
    name: string
    chunksUsed: number[]
    relevanceScore?: number
  }>
  totalChunks: number
  contextLength: number
}

export interface MessageMetadata {
  reasoning?: string
  ragContext?: RAGContext
}
