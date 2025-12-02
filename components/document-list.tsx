import { FileText, File, X, Plus } from "lucide-react"
import { Document } from "@/hooks/use-document-state"
import { cn } from "@/lib/utils"

interface DocumentListProps {
  documents: Document[]
  selectedDocumentId: string | null
  onSelectDocument: (id: string) => void
  onClose: () => void
}

/**
 * @param documents - The list of documents to display.
 * @param selectedDocumentId - The ID of the currently selected document.
 * @param onSelectDocument - Callback to select a document.
 * @param onClose - Callback to close the document list.
 */
export function DocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onClose,
}: DocumentListProps) {
  return (
    <div className="flex h-full flex-col bg-rose-50/80 dark:bg-black/95 backdrop-blur-md border-l border-border/50 dark:border-rose-300/30">
      <div className="p-4 border-b border-border/50 dark:border-rose-300/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm dark:text-rose-100">Documents</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* TODO: Implement document upload */}}
            className="p-1 hover:bg-white/50 dark:hover:bg-rose-400/20 rounded-md transition-colors"
            aria-label="Annex document"
            title="Annex document"
          >
            <Plus className="size-4 dark:text-rose-200" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 dark:hover:bg-rose-400/20 rounded-md transition-colors"
            aria-label="Close documents"
          >
            <X className="size-4 dark:text-rose-200" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {documents.map((doc) => {
          const isSelected = doc.id === selectedDocumentId
          const Icon = doc.type === "pdf" ? FileText : File

          return (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={cn(
                "w-full p-3 flex items-center gap-3 text-left hover:bg-white/50 dark:hover:bg-rose-400/10 transition-colors border-b border-gray-100 dark:border-rose-300/20",
                isSelected && "bg-white/70 dark:bg-rose-400/20 hover:bg-white/70 dark:hover:bg-rose-400/25"
              )}
            >
              <Icon className={cn("size-4 shrink-0", isSelected ? "text-primary dark:text-rose-400" : "dark:text-rose-200")} />
              <span className={cn("text-sm truncate dark:text-rose-100", isSelected && "font-medium dark:text-rose-50")}>
                {doc.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
