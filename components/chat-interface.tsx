"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  chatId: string | null
  chatTitle?: string
}

export function ChatInterface({ chatId, chatTitle }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Reset messages when chat changes
    if (chatId) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `Hello! I'm ready to discuss "${chatTitle}". How can I help you?`,
          timestamp: new Date(),
        },
      ])
    }
  }, [chatId, chatTitle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Focus back on input after sending
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a simulated response. In a real implementation, this would connect to your AI backend.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }, 1000)
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
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
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

            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap wrap-break-word">
                {message.content}
              </p>
              <span className="text-xs opacity-60 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {message.role === "user" && (
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="size-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
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
      </div>

      {/* Input Area */}
      <div className="p-4 flex-none">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <InputGroup className="[--radius:1rem] bg-rose-50/80 dark:bg-rose-950/20">
              <InputGroupTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
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
                >
                  <Paperclip className="size-4" />
                </InputGroupButton>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-xs"
                  className="rounded-full"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="size-4" />
                  <span className="sr-only">Send</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      </div>
    </div>
  )
}
