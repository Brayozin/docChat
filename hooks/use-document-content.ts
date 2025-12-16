'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface DocumentContent {
  id: string
  chatId: string
  name: string
  originalName: string
  type: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  contentText: string | null
  processingStatus: string
  processingError: string | null
  embeddingStatus: string
  embeddingError: string | null
}

/**
 * @param chatId - The chat ID that owns the document.
 * @param documentId - The document ID to fetch content for.
 * @returns The document content data, loading state, and error state.
 */
export function useDocumentContent(chatId: string | null, documentId: string | null) {
  const { data, error, mutate } = useSWR<DocumentContent>(
    chatId && documentId ? `/api/chats/${chatId}/documents/${documentId}` : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    document: data || null,
    isLoading: !error && !data && chatId !== null && documentId !== null,
    isError: error,
    refresh: mutate
  }
}

