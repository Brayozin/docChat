import { useState } from "react"

export type Document = {
  id: string
  name: string
  type: "pdf" | "markdown"
  fileSize?: number
  uploadedAt?: string
  processingStatus?: string
  embeddingStatus?: string
}

export function useDocumentState(documents: Document[] = []) {
  const [isListVisible, setIsListVisible] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  )

  const toggleList = () => {
    if (isListVisible) {
      // Closing the list, reset selection
      setIsListVisible(false)
      setSelectedDocumentId(null)
      return
    }
    setIsListVisible(true)
  }

  const selectDocument = (id: string) => {
    if (!document.startViewTransition) {
      setSelectedDocumentId(id)
      return
    }

    document.startViewTransition(() => {
      setSelectedDocumentId(id)
    })
  }

  const closeList = () => {
    if (!document.startViewTransition) {
      setIsListVisible(false)
      setSelectedDocumentId(null)
      return
    }

    document.startViewTransition(() => {
      setIsListVisible(false)
      setSelectedDocumentId(null)
    })
  }

  const goBackToList = () => {
    if (!document.startViewTransition) {
      setSelectedDocumentId(null)
      return
    }

    document.startViewTransition(() => {
      setSelectedDocumentId(null)
    })
  }

  const selectedDocument = selectedDocumentId
    ? documents.find((doc) => doc.id === selectedDocumentId) || null
    : null

  return {
    isListVisible,
    selectedDocumentId,
    selectedDocument,
    documents,
    toggleList,
    selectDocument,
    closeList,
    goBackToList,
  }
}
