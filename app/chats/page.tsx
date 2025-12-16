"use client"

import { useEffect, useRef, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ImperativePanelHandle } from "react-resizable-panels"
import { useDocumentState } from "@/hooks/use-document-state"
import { DocumentToggleButton } from "@/components/document-toggle-button"
import { DocumentList } from "@/components/document-list"
import { DocumentViewer } from "@/components/document-viewer"
import { ChatInterface } from "@/components/chat-interface"
import { MessageSquare, Search, Plus, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useChats, createChat } from "@/hooks/use-chats"
import { useChatDetail } from "@/hooks/use-chat-detail"
import { useDocumentUpload } from "@/hooks/use-document-upload"

interface Chat {
  id: string
  title: string
  description: string
  lastMessage?: {
    content: string
    createdAt: string
  }
  updatedAt: string
  messageCount: number
  documentCount: number
}

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffMs / 604800000)

  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return `${diffWeeks}w`
}

function ChatSidebarContent({
  selectedChatId,
  setSelectedChatId,
  searchQuery,
  setSearchQuery,
  filteredChats,
  toggleList,
  onNewChat,
}: {
  selectedChatId: string | null
  setSelectedChatId: (id: string | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredChats: Chat[]
  toggleList: () => void
  onNewChat: () => void
}) {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarContent className="p-0 bg-transparent backdrop-blur-md">
      <div className="p-4 border-b border-border/50 flex items-center justify-between group">
        <div
          className="cursor-pointer"
          onClick={isCollapsed ? toggleSidebar : undefined}
        >
          <Image
            src="/docChatLogo.svg"
            alt="DocChat"
            width={32}
            height={32}
            className="shrink-0"
          />
        </div>
        {!isCollapsed && <SidebarTrigger />}
      </div>

      {!isCollapsed && (
        <>
          <div className="p-3 space-y-2 border-b border-border/50">
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/50 rounded-md transition-colors"
            >
              <Plus className="size-4" />
              <span>New chat</span>
            </button>
            
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/50 rounded-md transition-colors"
            >
              <Search className="size-4" />
              <span>Search documents</span>
            </button>
            
            <button
              onClick={toggleList}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/50 rounded-md transition-colors"
            >
              <Paperclip className="size-4" />
              <span>Annex document</span>
            </button>
          </div>
          
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-transparent border-border/50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Search className="size-8 mb-2 opacity-30" />
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full p-3 flex items-start gap-3 text-left hover:bg-accent/50 transition-colors border-b border-border/30",
                      isSelected && "bg-accent/70"
                    )}
                  >
                    <MessageSquare
                      className={cn("size-4 shrink-0 mt-0.5", isSelected && "text-primary")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className={cn(
                            "text-sm truncate",
                            isSelected && "font-medium"
                          )}
                        >
                          {chat.title.length > 22 ? `${chat.title.slice(0, 22)}...` : chat.title}
                        </h4>
                        <span className="text-xs text-muted-foreground/60 shrink-0">
                          {getRelativeTime(chat.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {chat.description}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
      
      {isCollapsed && (
        <div className="p-3 space-y-2 flex flex-col items-center">
          <button
            onClick={onNewChat}
            className="p-2 hover:bg-accent/50 rounded-md transition-colors"
            title="New chat"
          >
            <Plus className="size-4" />
          </button>
          
          <button
            className="p-2 hover:bg-accent/50 rounded-md transition-colors"
            title="Search chats"
          >
            <Search className="size-4" />
          </button>
          
          <button
            onClick={toggleList}
            className="p-2 hover:bg-accent/50 rounded-md transition-colors"
            title="Annex document"
          >
            <Paperclip className="size-4" />
          </button>
        </div>
      )}
    </SidebarContent>
  )
}

export default function ChatsPage() {
  const { chats, isLoading, refresh } = useChats()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents for the selected chat
  const { documents: chatDocuments, refresh: refreshChat } = useChatDetail(selectedChatId)

  // Initialize upload hook
  const { uploads, startUpload, cancelUpload } = useDocumentUpload(() => {
    refreshChat()
  })

  const {
    isListVisible,
    selectedDocumentId,
    selectedDocument,
    documents,
    toggleList,
    selectDocument,
    closeList,
    goBackToList,
  } = useDocumentState(chatDocuments)

  const filteredChats = chats.filter((chat: Chat) => {
    const query = searchQuery.toLowerCase().trim()
    return !query || chat.description.toLowerCase().includes(query) || chat.title.toLowerCase().includes(query)
  })

  const handleNewChat = async () => {
    try {
      const newChat = await createChat('New Chat', '')
      await refresh()
      setSelectedChatId(newChat.id)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedChatId) {
      console.warn('No chat selected for upload')
      return
    }

    // Ensure document panel is visible
    if (!isListVisible) {
      toggleList()
    }

    // Trigger file input
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChatId) return

    // Start upload with progress tracking
    await startUpload(selectedChatId, file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenDocumentsForUpload = () => {
    // Open document panel if not visible
    if (!isListVisible) {
      toggleList()
    }
    // Then trigger file upload
    handleFileUpload()
  }

  const chatPanelRef = useRef<ImperativePanelHandle>(null)
  const docPanelRef = useRef<ImperativePanelHandle>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isInitialOpen, setIsInitialOpen] = useState(false)
  const prevSelectedDocId = useRef<string | null>(selectedDocumentId)
  const prevListVisible = useRef(isListVisible)

  useEffect(() => {
    // When closing the panel, reset everything
    if (!isListVisible && prevListVisible.current) {
      setIsInitialOpen(false)
      setIsTransitioning(false)
      prevSelectedDocId.current = null
      prevListVisible.current = false
      return
    }

    if (!isListVisible) {
      return
    }

    // Track that list is now visible
    prevListVisible.current = true

    // Check if this is the initial opening (no document was selected before)
    if (prevSelectedDocId.current === null && !selectedDocumentId) {
      setIsInitialOpen(true)
      const timer = setTimeout(() => setIsInitialOpen(false), 300)
      return () => clearTimeout(timer)
    }

    // Only transition when switching between document states
    if (prevSelectedDocId.current !== selectedDocumentId) {
      setIsTransitioning(true)
      
      const chatSize = selectedDocumentId ? 50 : 75
      const docSize = selectedDocumentId ? 50 : 25

      chatPanelRef.current?.resize(chatSize)
      docPanelRef.current?.resize(docSize)

      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 300)

      prevSelectedDocId.current = selectedDocumentId
      return () => clearTimeout(timer)
    }

    prevSelectedDocId.current = selectedDocumentId
  }, [selectedDocumentId, isListVisible])

  return (
    <SidebarProvider className="bg-transparent h-full w-full">
      <Sidebar
        variant="floating"
        collapsible="icon"
        className="bg-transparent backdrop-blur-[2px] **:data-[sidebar=sidebar]:bg-transparent"
      >
        <ChatSidebarContent
          selectedChatId={selectedChatId}
          setSelectedChatId={setSelectedChatId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredChats={filteredChats}
          toggleList={toggleList}
          onNewChat={handleNewChat}
        />
      </Sidebar>
      <SidebarInset className="bg-transparent! h-[94vh] w-full">
        <div className="relative h-full w-full p-3 box-border bg-transparent">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,application/pdf,text/markdown"
            onChange={handleFileSelected}
            className="hidden"
          />

          {!isListVisible && (
            <DocumentToggleButton onClick={toggleList} isActive={false} />
          )}

          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full rounded-lg border"
          >
            {/* Chat Section - Left */}
            <ResizablePanel
              ref={chatPanelRef}
              defaultSize={isListVisible ? (selectedDocumentId ? 50 : 75) : 100}
              minSize={30}
              className={isTransitioning ? "transition-all duration-300 ease-in-out" : ""}
            >
              <div className="h-full bg-transparent backdrop-blur-[2px]">
                <ChatInterface
                  chatId={selectedChatId}
                  chatTitle={chats.find((c: Chat) => c.id === selectedChatId)?.title}
                  onMessageSent={refresh}
                  onOpenDocuments={handleOpenDocumentsForUpload}
                />
              </div>
            </ResizablePanel>

            {/* Documents Section - Right */}
            {isListVisible && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  ref={docPanelRef}
                  defaultSize={selectedDocumentId ? 50 : 25}
                  minSize={20}
                  maxSize={70}
                  className={
                    isInitialOpen
                      ? "animate-slide-in-right bg-transparent backdrop-blur-[2px]"
                      : isTransitioning
                        ? "transition-all duration-300 ease-in-out bg-transparent backdrop-blur-[2px]"
                        : ""
                  }
                  style={{ viewTransitionName: 'document-panel' } as React.CSSProperties}
                >
                  <div className="h-full bg-transparent backdrop-blur-[2px]">
                    {selectedDocumentId ? (
                      <DocumentViewer
                        document={selectedDocument}
                        chatId={selectedChatId}
                        onBack={goBackToList}
                        onClose={closeList}
                      />
                    ) : (
                      <DocumentList
                        documents={documents}
                        selectedDocumentId={selectedDocumentId}
                        onSelectDocument={selectDocument}
                        onClose={closeList}
                        onUpload={handleFileUpload}
                        uploads={uploads}
                        onCancelUpload={cancelUpload}
                      />
                    )}
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
