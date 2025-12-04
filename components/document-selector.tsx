"use client"

import { FileText, File, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectableDocument {
  id: string
  name: string
  type: string
  embeddingStatus?: string
}

interface DocumentSelectorProps {
  documents: SelectableDocument[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function DocumentSelector({
  documents,
  selectedIds,
  onSelectionChange,
}: DocumentSelectorProps) {
  const toggleDocument = (docId: string) => {
    if (selectedIds.includes(docId)) {
      onSelectionChange(selectedIds.filter(id => id !== docId))
    } else {
      onSelectionChange([...selectedIds, docId])
    }
  }

  const toggleAll = () => {
    if (selectedIds.length === documents.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(documents.map(d => d.id))
    }
  }

  const allSelected = documents.length > 0 && selectedIds.length === documents.length

  return (
    documents.length === 0 ? (
      <div className="text-xs text-muted-foreground dark:text-rose-300/60 p-2">
        No documents available
      </div>
    ) : (
      <div className="space-y-1">
        <button
          onClick={toggleAll}
          className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground dark:text-rose-300 hover:bg-white/50 dark:hover:bg-rose-400/10 transition-colors rounded-md"
        >
          {allSelected ? (
            <CheckSquare className="size-3.5" />
          ) : (
            <Square className="size-3.5" />
          )}
          <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
        </button>

        <div className="space-y-0.5">
          {documents.map((doc) => {
            const isSelected = selectedIds.includes(doc.id)
            const Icon = doc.type === "pdf" ? FileText : File
            const hasEmbeddings = doc.embeddingStatus === 'completed'

            return (
              <button
                key={doc.id}
                onClick={() => toggleDocument(doc.id)}
                className={cn(
                  "w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-white/50 dark:hover:bg-rose-400/10 transition-colors rounded-md",
                  isSelected && "bg-white/70 dark:bg-rose-400/20"
                )}
              >
                {isSelected ? (
                  <CheckSquare className="size-3.5 shrink-0 text-primary dark:text-rose-400" />
                ) : (
                  <Square className="size-3.5 shrink-0 text-muted-foreground dark:text-rose-300/60" />
                )}
                <Icon className={cn(
                  "size-3.5 shrink-0",
                  isSelected ? "text-primary dark:text-rose-400" : "text-muted-foreground dark:text-rose-300/60"
                )} />
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-xs truncate block dark:text-rose-100",
                    isSelected && "font-medium dark:text-rose-50"
                  )}>
                    {doc.name}
                  </span>
                  {doc.embeddingStatus && (
                    <span className={cn(
                      "text-[10px] truncate block",
                      hasEmbeddings ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                      {hasEmbeddings ? 'Vector search' : 'Full-text only'}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  )
}
