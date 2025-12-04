'use client'

import { useState, useCallback, useRef } from 'react'
import { ProgressState, ProgressEvent } from '@/types/upload'

const MAX_CONCURRENT_UPLOADS = 3
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

interface UseDocumentUploadReturn {
  uploads: Map<string, ProgressState>
  startUpload: (chatId: string, file: File) => Promise<string>
  cancelUpload: (uploadId: string) => void
  clearCompleted: () => void
}

export function useDocumentUpload(onComplete?: () => void): UseDocumentUploadReturn {
  const [uploads, setUploads] = useState<Map<string, ProgressState>>(new Map())
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map())
  const uploadQueueRef = useRef<Array<{ chatId: string; file: File; resolve: (id: string) => void }>>([])
  const activeUploadsRef = useRef<Set<string>>(new Set())

  const updateUpload = useCallback((id: string, update: Partial<ProgressState>) => {
    setUploads(prev => {
      const next = new Map(prev)
      const existing = next.get(id)
      if (existing) {
        next.set(id, { ...existing, ...update })
      }
      return next
    })
  }, [])

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    eventSourcesRef.current.delete(id)
    activeUploadsRef.current.delete(id)
  }, [])

  const processQueue = useCallback(() => {
    const queue = uploadQueueRef.current
    const active = activeUploadsRef.current

    while (queue.length > 0 && active.size < MAX_CONCURRENT_UPLOADS) {
      const item = queue.shift()
      if (item) {
        doUpload(item.chatId, item.file, item.resolve)
      }
    }
  }, [])

  const doUpload = useCallback(async (
    chatId: string,
    file: File,
    resolve: (id: string) => void,
    retryCount = 0
  ) => {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Add to active uploads
    activeUploadsRef.current.add(uploadId)

    // Initialize upload state
    const initialState: ProgressState = {
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      progress: 0,
      startedAt: new Date()
    }

    setUploads(prev => new Map(prev).set(uploadId, initialState))
    resolve(uploadId)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)

      // Upload file and get SSE stream URL
      const uploadResponse = await fetch(`/api/chats/${chatId}/documents/stream`, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      // Create EventSource from the response
      const reader = uploadResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: ProgressEvent = JSON.parse(line.slice(6))

              if (event.type === 'progress') {
                updateUpload(uploadId, {
                  status: event.status,
                  progress: event.progress || 0,
                  message: event.message
                })
              } else if (event.type === 'complete') {
                updateUpload(uploadId, {
                  status: 'ready',
                  progress: 100,
                  message: 'Upload complete'
                })

                // Call completion callback
                setTimeout(() => {
                  onComplete?.()
                  removeUpload(uploadId)
                  processQueue()
                }, 2000)
              } else if (event.type === 'error') {
                updateUpload(uploadId, {
                  status: 'error',
                  error: event.message || event.error || 'Upload failed'
                })

                activeUploadsRef.current.delete(uploadId)
                processQueue()
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error)

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        updateUpload(uploadId, {
          message: `Retrying... (${retryCount + 1}/${MAX_RETRIES})`
        })

        setTimeout(() => {
          activeUploadsRef.current.delete(uploadId)
          doUpload(chatId, file, () => {}, retryCount + 1)
        }, RETRY_DELAY * (retryCount + 1))
      } else {
        updateUpload(uploadId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        })

        activeUploadsRef.current.delete(uploadId)
        processQueue()
      }
    }
  }, [updateUpload, removeUpload, onComplete, processQueue])

  const startUpload = useCallback(async (chatId: string, file: File): Promise<string> => {
    return new Promise((resolve) => {
      // Check if we can start immediately
      if (activeUploadsRef.current.size < MAX_CONCURRENT_UPLOADS) {
        doUpload(chatId, file, resolve)
      } else {
        // Add to queue
        uploadQueueRef.current.push({ chatId, file, resolve })
      }
    })
  }, [doUpload])

  const cancelUpload = useCallback((uploadId: string) => {
    // Close EventSource if exists
    const eventSource = eventSourcesRef.current.get(uploadId)
    if (eventSource) {
      eventSource.close()
    }

    // Remove from state
    removeUpload(uploadId)

    // Process next in queue
    processQueue()
  }, [removeUpload, processQueue])

  const clearCompleted = useCallback(() => {
    setUploads(prev => {
      const next = new Map(prev)
      for (const [id, upload] of next.entries()) {
        if (upload.status === 'ready') {
          next.delete(id)
        }
      }
      return next
    })
  }, [])

  return {
    uploads,
    startUpload,
    cancelUpload,
    clearCompleted
  }
}
