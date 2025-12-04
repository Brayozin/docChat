"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Paperclip, ChevronDown, ChevronRight, Brain, Square, FileText, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { useChatDetail, streamChatResponse } from "@/hooks/use-chat-detail"
import { MessageMetadata } from "@/types/upload"
import { DocumentSelector, SelectableDocument } from "@/components/document-selector"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  metadata?: string
}

interface ChatInterfaceProps {
  chatId: string | null
  chatTitle?: string
  onMessageSent?: () => void
  onOpenDocuments?: () => void
}

export function ChatInterface({ chatId, chatTitle, onMessageSent, onOpenDocuments }: ChatInterfaceProps) {
  const { messages: apiMessages, documents: chatDocuments, isLoading: loadingChat, refresh } = useChatDetail(chatId)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [streamingReasoning, setStreamingReasoning] = useState("")
  const [showStreamingReasoning, setShowStreamingReasoning] = useState(false)
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set())
  const [expandedContext, setExpandedContext] = useState<Set<string>>(new Set())
  const [showDocumentSelector, setShowDocumentSelector] = useState(false)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const readyDocs = chatDocuments.filter((d: any) => d.processingStatus === 'ready')
    setSelectedDocumentIds(readyDocs.map((d: any) => d.id))
  }, [chatDocuments])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [apiMessages, streamingMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming || !chatId) return

    const messageContent = input.trim()
    setInput("")
    setPendingUserMessage(messageContent)
    setIsStreaming(true)
    setStreamingMessage("")
    setStreamingReasoning("")
    setShowStreamingReasoning(false)

    // Focus back on input after sending
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController()

    await streamChatResponse(
      chatId,
      messageContent,
      {
        onContentChunk: (chunk) => {
          setStreamingMessage((prev) => prev + chunk)
        },
        onReasoningChunk: (chunk) => {
          setStreamingReasoning((prev) => prev + chunk)
        },
        onReasoningStart: () => {
          setShowStreamingReasoning(true)
        },
        onReasoningEnd: () => {
          // Keep showing reasoning
        },
        onDone: () => {
          setIsStreaming(false)
          setPendingUserMessage(null)
          setStreamingMessage("")
          setStreamingReasoning("")
          setShowStreamingReasoning(false)
          abortControllerRef.current = null
          refresh()
          onMessageSent?.()
          requestAnimationFrame(() => {
            inputRef.current?.focus()
          })
        },
        onError: (error) => {
          console.error('Streaming error:', error)
          setIsStreaming(false)
          setPendingUserMessage(null)
          setStreamingMessage("")
          setStreamingReasoning("")
          setShowStreamingReasoning(false)
          abortControllerRef.current = null
        },
        signal: abortControllerRef.current.signal,
        documentIds: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined
      }
    )
  }

  const handleStop = async () => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    abortControllerRef.current = null
    
    // Small delay to let the server save the partial response
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Clear streaming state and refresh to get the saved partial response
    setPendingUserMessage(null)
    setStreamingMessage("")
    setStreamingReasoning("")
    setShowStreamingReasoning(false)
    refresh()
    
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const toggleContext = (messageId: string) => {
    setExpandedContext((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="size-16 mx-auto text-muted-foreground/30" />
          <div>
            <h2 className="text-2xl font-semibold text-muted-foreground">
              Select a chat to start
            </h2>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Choose a conversation from the sidebar or create a new one
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="border-b border-border/50 p-4 backdrop-blur-sm flex-none">
        <h2 className="font-semibold truncate">{chatTitle || "Chat"}</h2>
        <p className="text-xs text-muted-foreground">
          {apiMessages.length} message{apiMessages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingChat ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : (
          <>
            {apiMessages.map((message: Message) => {
              const hasMetadata = message.role === "assistant" && message.metadata
              let reasoning = ""
              let metadata: MessageMetadata | null = null

              try {
                if (hasMetadata && message.metadata) {
                  metadata = JSON.parse(message.metadata)
                  reasoning = metadata?.reasoning || ""
                }
              } catch (e) {
                // Ignore parse errors
              }

              const hasReasoning = !!reasoning
              const hasRagContext = !!metadata?.ragContext
              const isReasoningExpanded = expandedReasoning.has(message.id)
              const isContextExpanded = expandedContext.has(message.id)

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 group",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="size-4 text-primary" />
                    </div>
                  )}

                  <div className={cn("max-w-[70%] flex flex-col gap-2")}>
                    {/* Reasoning Section */}
                    {hasReasoning && reasoning && (
                      <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
                        <button
                          onClick={() => toggleReasoning(message.id)}
                          className="w-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {isReasoningExpanded ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                          <Brain className="size-3.5" />
                          <span>Reasoning</span>
                        </button>
                        {isReasoningExpanded && (
                          <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-900">
                            <p className="text-xs text-blue-900 dark:text-blue-100 whitespace-pre-wrap font-mono leading-relaxed">
                              {reasoning}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RAG Context Section */}
                    {hasRagContext && metadata?.ragContext && (
                      <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 overflow-hidden">
                        <button
                          onClick={() => toggleContext(message.id)}
                          className="w-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors"
                        >
                          {isContextExpanded ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                          <FileText className="size-3.5" />
                          <span>
                            Context ({metadata.ragContext.documentsUsed.length} {metadata.ragContext.documentsUsed.length === 1 ? 'document' : 'documents'})
                          </span>
                        </button>
                        {isContextExpanded && (
                          <div className="px-4 py-3 border-t border-green-200 dark:border-green-900">
                            <div className="space-y-2">
                              {metadata.ragContext.documentsUsed.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-start gap-2 text-xs text-green-900 dark:text-green-100"
                                >
                                  <FileText className="size-3 mt-0.5 shrink-0" />
                                  <div>
                                    <div className="font-medium">{doc.name}</div>
                                    <div className="text-green-700 dark:text-green-300 opacity-70">
                                      {doc.chunksUsed.length} {doc.chunksUsed.length === 1 ? 'chunk' : 'chunks'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="mt-3 pt-2 border-t border-green-200 dark:border-green-900 text-xs text-green-700 dark:text-green-300">
                                <div>Total: {metadata.ragContext.totalChunks} chunks</div>
                                <div>Context length: {metadata.ragContext.contextLength.toLocaleString()} characters</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="size-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              )
            })}

            {pendingUserMessage && (
              <div className="flex gap-3 justify-end">
                <div className="max-w-[70%] flex flex-col gap-2">
                  <div className="rounded-2xl px-4 py-2 bg-primary text-primary-foreground">
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {pendingUserMessage}
                    </p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <User className="size-4 text-primary-foreground" />
                </div>
              </div>
            )}

            {(streamingMessage || streamingReasoning) && (
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="max-w-[70%] flex flex-col gap-2">
                  {/* Streaming/Stopped Reasoning */}
                  {streamingReasoning && (
                    <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
                      <div className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <Brain className={cn("size-3.5", isStreaming && "animate-pulse")} />
                        <span>{isStreaming ? "Thinking..." : "Reasoning"}</span>
                      </div>
                      <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-900">
                        <p className="text-xs text-blue-900 dark:text-blue-100 whitespace-pre-wrap font-mono leading-relaxed">
                          {streamingReasoning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Streaming/Stopped Message Content */}
                  {streamingMessage && (
                    <div className="rounded-2xl px-4 py-2 bg-muted">
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">
                        {streamingMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isStreaming && !streamingMessage && (
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="size-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-muted-foreground/30 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 flex-none border-t border-border/50">
        <div className="max-w-3xl mx-auto space-y-3">
          {showDocumentSelector && chatDocuments.length > 0 && (
            <div className="bg-white dark:bg-rose-950/30 rounded-lg border border-border/50 dark:border-rose-300/30 p-3 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground dark:text-rose-300">
                  Select documents for context
                </h4>
                <button
                  onClick={() => setShowDocumentSelector(false)}
                  className="text-xs text-muted-foreground dark:text-rose-300 hover:text-foreground dark:hover:text-rose-100"
                >
                  Close
                </button>
              </div>
              <DocumentSelector
                documents={chatDocuments
                  .filter((d: any) => d.processingStatus === 'ready')
                  .map((d: any): SelectableDocument => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    embeddingStatus: d.embeddingStatus
                  }))}
                selectedIds={selectedDocumentIds}
                onSelectionChange={setSelectedDocumentIds}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <InputGroup className="[--radius:1rem] bg-rose-50/80 dark:bg-rose-950/20">
              <InputGroupTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isStreaming}
                className="min-h-[52px] max-h-32 resize-none bg-transparent"
                rows={1}
              />
              <InputGroupAddon align="block-end">
                <p className="text-xs text-muted-foreground/60">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full ml-auto"
                  type="button"
                  onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                  disabled={isStreaming || !chatId || chatDocuments.length === 0}
                  title="Select documents"
                >
                  <Filter className={cn(
                    "size-4",
                    selectedDocumentIds.length > 0 && selectedDocumentIds.length < chatDocuments.filter((d: any) => d.processingStatus === 'ready').length && "text-primary dark:text-rose-400"
                  )} />
                </InputGroupButton>
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  type="button"
                  onClick={onOpenDocuments}
                  disabled={isStreaming || !chatId}
                  title="Attach document"
                >
                  <Paperclip className="size-4" />
                </InputGroupButton>
                {isStreaming ? (
                  <InputGroupButton
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    className="rounded-full"
                    onClick={handleStop}
                  >
                    <Square className="size-3 fill-current" />
                    <span className="sr-only">Stop</span>
                  </InputGroupButton>
                ) : (
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    size="icon-xs"
                    className="rounded-full"
                    disabled={!input.trim()}
                  >
                    <Send className="size-4" />
                    <span className="sr-only">Send</span>
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      </div>
    </div>
  )
}
