'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useChatDetail(chatId: string | null) {
  const { data, error, mutate } = useSWR(
    chatId ? `/api/chats/${chatId}` : null,
    fetcher,
    {
      refreshInterval: 0, // Don't auto-refresh
      revalidateOnFocus: false
    }
  )

  return {
    chat: data || null,
    messages: data?.messages || [],
    documents: data?.documents || [],
    isLoading: !error && !data && chatId !== null,
    isError: error,
    refresh: mutate
  }
}

export async function sendMessage(chatId: string, content: string) {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'user', content })
  })

  if (!response.ok) {
    throw new Error('Failed to send message')
  }

  return response.json()
}

export interface StreamCallbacks {
  onContentChunk?: (chunk: string) => void
  onReasoningChunk?: (chunk: string) => void
  onReasoningStart?: () => void
  onReasoningEnd?: () => void
  onDone?: () => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

export async function streamChatResponse(
  chatId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void>

export async function streamChatResponse(
  chatId: string,
  message: string,
  callbacks: StreamCallbacks
): Promise<void>

export async function streamChatResponse(
  chatId: string,
  message: string,
  callbacksOrOnChunk: StreamCallbacks | ((chunk: string) => void),
  onDone?: () => void,
  onError?: (error: Error) => void
) {
  try {
    // Handle both old and new API
    const callbacks: StreamCallbacks = typeof callbacksOrOnChunk === 'function'
      ? {
          onContentChunk: callbacksOrOnChunk,
          onDone,
          onError
        }
      : callbacksOrOnChunk

    const response = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
      signal: callbacks.signal
    })

    if (!response.ok) {
      throw new Error('Failed to get chat response')
    }

    const reader = response.body?.getReader()
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
            const data = JSON.parse(line.slice(6))

            if (data.type === 'content' && data.chunk) {
              callbacks.onContentChunk?.(data.chunk)
            } else if (data.type === 'reasoning' && data.chunk) {
              callbacks.onReasoningChunk?.(data.chunk)
            } else if (data.type === 'reasoning_start') {
              callbacks.onReasoningStart?.()
            } else if (data.type === 'reasoning_end') {
              callbacks.onReasoningEnd?.()
            } else if (data.chunk) {
              // Fallback for old API
              callbacks.onContentChunk?.(data.chunk)
            } else if (data.done) {
              callbacks.onDone?.()
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    }
  } catch (error) {
    // Ignore abort errors - these are expected when user stops the stream
    if (error instanceof Error && error.name === 'AbortError') {
      return
    }
    
    if (typeof callbacksOrOnChunk === 'function') {
      onError?.(error as Error)
    } else {
      callbacksOrOnChunk.onError?.(error as Error)
    }
  }
}
