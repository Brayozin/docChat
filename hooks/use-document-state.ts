import { useState } from "react"

export type Document = {
  id: string
  name: string
  type: "pdf" | "markdown"
}

const MOCK_DOCUMENTS: Document[] = [
  { id: "1", name: "Project Proposal.pdf", type: "pdf" },
  { id: "2", name: "Meeting Notes.md", type: "markdown" },
  { id: "3", name: "Technical Spec.pdf", type: "pdf" },
  { id: "4", name: "README.md", type: "markdown" },
  { id: "5", name: "User Guide.pdf", type: "pdf" },
  { id: "6", name: "Architecture.md", type: "markdown" },
  { id: "7", name: "API Documentation.pdf", type: "pdf" },
]

export function useDocumentState() {
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
    ? MOCK_DOCUMENTS.find((doc) => doc.id === selectedDocumentId) || null
    : null

  return {
    isListVisible,
    selectedDocumentId,
    selectedDocument,
    documents: MOCK_DOCUMENTS,
    toggleList,
    selectDocument,
    closeList,
    goBackToList,
  }
}
