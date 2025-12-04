import { FileText, File, X, Plus } from "lucide-react"
import { Document } from "@/hooks/use-document-state"
import { cn } from "@/lib/utils"
import { DocumentProgress } from "./document-progress"
import { ProgressState } from "@/types/upload"

interface DocumentListProps {
  documents: Document[]
  selectedDocumentId: string | null
  onSelectDocument: (id: string) => void
  onClose: () => void
  onUpload?: () => void
  uploads?: Map<string, ProgressState>
  onCancelUpload?: (uploadId: string) => void
}

/**
 * @param documents - The list of documents to display.
 * @param selectedDocumentId - The ID of the currently selected document.
 * @param onSelectDocument - Callback to select a document.
 * @param onClose - Callback to close the document list.
 * @param onUpload - Callback to trigger file upload.
 * @param uploads - Map of active uploads.
 * @param onCancelUpload - Callback to cancel an upload.
 */
export function DocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onClose,
  onUpload,
  uploads,
  onCancelUpload,
}: DocumentListProps) {
  const activeUploads = uploads ? Array.from(uploads.values()) : []
  const hasUploads = activeUploads.length > 0
  return (
    <div className="flex h-full flex-col bg-rose-50/80 dark:bg-black/95 backdrop-blur-md border-l border-border/50 dark:border-rose-300/30">
      <div className="p-4 border-b border-border/50 dark:border-rose-300/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm dark:text-rose-100">Documents</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onUpload}
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
        {/* Upload Progress Section */}
        {hasUploads && (
          <div className="p-3 space-y-2 border-b border-border/50 dark:border-rose-300/30 bg-white/30 dark:bg-rose-950/20">
            <h4 className="text-xs font-medium text-muted-foreground dark:text-rose-300 mb-2">
              Uploading ({activeUploads.length})
            </h4>
            {activeUploads.map((upload) => (
              <DocumentProgress
                key={upload.id}
                upload={upload}
                onCancel={onCancelUpload}
              />
            ))}
          </div>
        )}

        {/* Documents List */}
        {documents.length === 0 && !hasUploads ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground dark:text-rose-300/60">
            <FileText className="size-8 mb-2 opacity-30" />
            <p className="text-sm">No documents yet</p>
            <p className="text-xs mt-1">Click + to upload</p>
          </div>
        ) : (
          documents.map((doc) => {
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
          })
        )}
      </div>
    </div>
  )
}
