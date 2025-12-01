import { Document } from "@/hooks/use-document-state"
import { FileText, ArrowLeft, X } from "lucide-react"

interface DocumentViewerProps {
  document: Document | null
  onBack: () => void
  onClose: () => void
}

/**
 * @param document - The document to display.
 * @param onBack - Callback to go back to the document list.
 * @param onClose - Callback to close the document viewer.
 */
export function DocumentViewer({ document, onBack, onClose }: DocumentViewerProps) {
  if (!document) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent backdrop-blur-[1px]">
        <div className="text-center text-muted-foreground">
          <FileText className="size-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a document to view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-transparent backdrop-blur-[1px]">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1 hover:bg-white/50 rounded-md transition-colors shrink-0"
            aria-label="Back to documents"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{document.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {document.type === "pdf" ? "PDF Document" : "Markdown File"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/50 rounded-md transition-colors shrink-0"
          aria-label="Close document"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground max-w-md">
          <FileText className="size-16 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium mb-2">Document Viewer</p>
          <p className="text-xs">
            PDF and Markdown rendering coming soon. This is a placeholder for
            the document viewer layout.
          </p>
        </div>
      </div>
    </div>
  )
}
