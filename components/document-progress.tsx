import { ProgressState } from '@/types/upload'
import { Upload, FileText, Database, CheckCircle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentProgressProps {
  upload: ProgressState
  onCancel?: (id: string) => void
}

export function DocumentProgress({ upload, onCancel }: DocumentProgressProps) {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'uploading':
        return <Upload className="size-4 animate-pulse text-blue-500" />
      case 'extracting':
        return <FileText className="size-4 animate-pulse text-purple-500" />
      case 'indexing':
        return <Database className="size-4 animate-pulse text-green-500" />
      case 'ready':
        return <CheckCircle className="size-4 text-green-500" />
      case 'error':
        return <XCircle className="size-4 text-red-500" />
      default:
        return <Upload className="size-4" />
    }
  }

  const getStatusMessage = () => {
    if (upload.error) return upload.error
    if (upload.message) return upload.message

    switch (upload.status) {
      case 'uploading':
        return 'Uploading file...'
      case 'extracting':
        return 'Extracting text...'
      case 'indexing':
        return 'Processing and indexing...'
      case 'ready':
        return 'Ready!'
      case 'error':
        return 'Upload failed'
      default:
        return 'Processing...'
    }
  }

  const isError = upload.status === 'error'
  const isComplete = upload.status === 'ready'

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        isError && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
        isComplete && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
        !isError && !isComplete && 'bg-white dark:bg-rose-950/10 border-border/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{getStatusIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium truncate dark:text-rose-100">
              {upload.fileName}
            </span>
            {onCancel && upload.status !== 'ready' && upload.status !== 'error' && (
              <button
                onClick={() => onCancel(upload.id)}
                className="p-1 hover:bg-white/50 dark:hover:bg-rose-400/20 rounded transition-colors"
                aria-label="Cancel upload"
              >
                <X className="size-3 dark:text-rose-200" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {/* Progress bar */}
            {!isError && (
              <div className="w-full bg-gray-200 dark:bg-rose-900/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 ease-out rounded-full',
                    isComplete ? 'bg-green-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}

            {/* Status message */}
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-xs',
                  isError && 'text-red-600 dark:text-red-400',
                  isComplete && 'text-green-600 dark:text-green-400',
                  !isError && !isComplete && 'text-muted-foreground dark:text-rose-300'
                )}
              >
                {getStatusMessage()}
              </span>
              {!isError && (
                <span className="text-xs text-muted-foreground dark:text-rose-300">
                  {upload.progress}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
