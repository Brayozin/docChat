import { Document } from "@/hooks/use-document-state"
import { useDocumentContent } from "@/hooks/use-document-content"
import { FileText, ArrowLeft, X, Loader2, AlertCircle, Eye, FileCode } from "lucide-react"
import { useMemo, useState } from "react"
import MarkdownIt from "markdown-it"
import { PDFCanvasViewer } from "./pdf-canvas-viewer"

interface DocumentViewerProps {
  document: Document | null
  chatId: string | null
  onBack: () => void
  onClose: () => void
}

/**
 * @param document - The document to display.
 * @param chatId - The chat ID that owns the document.
 * @param onBack - Callback to go back to the document list.
 * @param onClose - Callback to close the document viewer.
 */
export function DocumentViewer({ document, chatId, onBack, onClose }: DocumentViewerProps) {
  const { document: documentContent, isLoading, isError } = useDocumentContent(
    chatId,
    document?.id || null
  )
  
  const [viewMode, setViewMode] = useState<'rendered' | 'text'>('rendered')

  const md = useMemo(() => new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
  }), [])

  const renderedMarkdown = useMemo(() => {
    if (!documentContent?.contentText || document?.type !== "markdown") {
      return null
    }
    return md.render(documentContent.contentText)
  }, [documentContent?.contentText, document?.type, md])
  
  const pdfUrl = useMemo(() => {
    if (!documentContent || document?.type !== "pdf") return null
    return `/api/chats/${chatId}/documents/${document?.id}/file`
  }, [documentContent, document?.type, document?.id, chatId])

  const isProcessing = documentContent?.processingStatus !== 'ready'
  const hasError = documentContent?.processingError || isError
  if (!document) {
    return (
      <div className="flex h-full items-center justify-center bg-rose-50/80 dark:bg-black/90 backdrop-blur-md border-l border-border/50 dark:border-rose-300/30">
        <div className="text-center text-muted-foreground dark:text-rose-200">
          <FileText className="size-12 mx-auto mb-4 opacity-50 dark:opacity-40 dark:text-rose-300" />
          <p className="text-sm">Select a document to view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-rose-50/80 dark:bg-black/90 backdrop-blur-md border-l border-border/50 dark:border-rose-300/30">
      <div className="p-4 border-b border-border/50 dark:border-rose-300/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1 hover:bg-white/50 dark:hover:bg-rose-500/20 rounded-md transition-colors shrink-0"
            aria-label="Back to documents"
          >
            <ArrowLeft className="size-4 dark:text-rose-100" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate dark:text-rose-100">{document.name}</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-50/40 mt-1">
              {document.type === "pdf" ? "PDF Document" : "Markdown File"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(document.type === "pdf" || document.type === "markdown") && (
            <div className="flex items-center gap-1 bg-white/30 dark:bg-rose-950/30 rounded-md p-1">
              <button
                onClick={() => setViewMode('rendered')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'rendered'
                    ? 'bg-white dark:bg-rose-500/30 text-foreground dark:text-rose-100'
                    : 'hover:bg-white/50 dark:hover:bg-rose-500/20 text-muted-foreground dark:text-rose-200/60'
                }`}
                aria-label={document.type === "pdf" ? "PDF view" : "Rendered view"}
                title={document.type === "pdf" ? "PDF view" : "Rendered view"}
              >
                <Eye className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'text'
                    ? 'bg-white dark:bg-rose-500/30 text-foreground dark:text-rose-100'
                    : 'hover:bg-white/50 dark:hover:bg-rose-500/20 text-muted-foreground dark:text-rose-200/60'
                }`}
                aria-label="Text view"
                title="Text view"
              >
                <FileCode className="size-4" />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 dark:hover:bg-rose-400/20 rounded-md transition-colors shrink-0"
            aria-label="Close document"
          >
            <X className="size-4 dark:text-rose-100" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground dark:text-rose-200">
              <Loader2 className="size-12 mx-auto mb-4 animate-spin dark:text-rose-300" />
              <p className="text-sm">Loading document...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground dark:text-rose-200 max-w-md">
              <AlertCircle className="size-12 mx-auto mb-4 text-destructive dark:text-rose-400" />
              <p className="text-sm font-medium mb-2 dark:text-rose-300">Failed to load document</p>
              <p className="text-xs dark:text-rose-300">
                {documentContent?.processingError || 'An error occurred while loading the document'}
              </p>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground dark:text-rose-200 max-w-md">
              <Loader2 className="size-12 mx-auto mb-4 animate-spin dark:text-rose-300" />
              <p className="text-sm font-medium mb-2 dark:text-rose-300">Processing document</p>
              <p className="text-xs dark:text-rose-300">
                This document is still being processed. Please wait...
              </p>
            </div>
          </div>
        ) : !documentContent?.contentText ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground dark:text-rose-200 max-w-md">
              <FileText className="size-12 mx-auto mb-4 opacity-30 dark:opacity-40 dark:text-rose-300" />
              <p className="text-sm font-medium mb-2 dark:text-rose-300">No content available</p>
              <p className="text-xs dark:text-rose-300">
                This document has no text content to display.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {document?.type === "markdown" ? (
              viewMode === 'rendered' ? (
                <div className="max-w-4xl mx-auto">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none prose-headings:dark:text-rose-100 prose-p:dark:text-rose-100 prose-strong:dark:text-rose-50 prose-code:dark:text-rose-200 prose-pre:dark:bg-rose-950/40 prose-a:dark:text-rose-300"
                    dangerouslySetInnerHTML={{ __html: renderedMarkdown || '' }}
                  />
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white dark:bg-rose-950/20 rounded-lg p-6 border border-border/50 dark:border-rose-300/30">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground dark:text-rose-100">
                      {documentContent.contentText}
                    </pre>
                  </div>
                </div>
              )
            ) : document?.type === "pdf" ? (
              viewMode === 'rendered' && pdfUrl ? (
                <PDFCanvasViewer 
                  pdfUrl={pdfUrl} 
                  documentName={document.name}
                />
              ) : (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white dark:bg-rose-950/20 rounded-lg p-6 border border-border/50 dark:border-rose-300/30">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground dark:text-rose-100">
                      {documentContent.contentText}
                    </pre>
                  </div>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
