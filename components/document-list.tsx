import { FileText, File, X } from "lucide-react"
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
    <div className="flex h-full flex-col bg-transparent backdrop-blur-[1px]">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Documents</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/50 rounded-md transition-colors"
          aria-label="Close documents"
        >
          <X className="size-4" />
        </button>
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
                "w-full p-3 flex items-center gap-3 text-left hover:bg-white/50 transition-colors border-b border-gray-100",
                isSelected && "bg-white/70 hover:bg-white/70"
              )}
            >
              <Icon className={cn("size-4 shrink-0", isSelected && "text-primary")} />
              <span className={cn("text-sm truncate", isSelected && "font-medium")}>
                {doc.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
