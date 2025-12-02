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

interface Chat {
  id: string
  title: string
  description: string
  lastMessage?: string
  timestamp: string
}

const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    title: "Project Planning",
    description: "Discussion about the new feature roadmap and timeline for Q1 2025",
    lastMessage: "Let's schedule a follow-up meeting",
    timestamp: "2h",
  },
  {
    id: "2",
    title: "Bug Report Analysis",
    description: "Analyzing critical bugs in the authentication system that need immediate attention",
    lastMessage: "Fixed the login issue",
    timestamp: "5h",
  },
  {
    id: "3",
    title: "Design Review",
    description: "Review of the new UI components and design system updates",
    lastMessage: "The mockups look great!",
    timestamp: "1d",
  },
  {
    id: "4",
    title: "API Integration",
    description: "Discussing the integration with third-party payment gateway and webhook setup",
    lastMessage: "API keys have been configured",
    timestamp: "2d",
  },
  {
    id: "5",
    title: "Performance Optimization",
    description: "Strategies to improve application load time and reduce bundle size",
    lastMessage: "Implemented lazy loading",
    timestamp: "3d",
  },
  {
    id: "6",
    title: "Database Migration",
    description: "Planning the migration from PostgreSQL to a more scalable solution",
    lastMessage: "Migration script is ready",
    timestamp: "1w",
  },
  {
    id: "7",
    title: "Security Audit",
    description: "Comprehensive security review of authentication and authorization flows",
    lastMessage: "All vulnerabilities addressed",
    timestamp: "1w",
  },
  {
    id: "8",
    title: "Mobile Responsiveness",
    description: "Making the application fully responsive for mobile and tablet devices",
    lastMessage: "Testing on different devices",
    timestamp: "2w",
  },
]

function ChatSidebarContent({
  selectedChatId,
  setSelectedChatId,
  searchQuery,
  setSearchQuery,
  filteredChats,
  toggleList,
}: {
  selectedChatId: string | null
  setSelectedChatId: (id: string | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredChats: Chat[]
  toggleList: () => void
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
              onClick={() => setSelectedChatId(null)}
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
                          {chat.timestamp}
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
            onClick={() => setSelectedChatId(null)}
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
  const {
    isListVisible,
    selectedDocumentId,
    selectedDocument,
    documents,
    toggleList,
    selectDocument,
    closeList,
    goBackToList,
  } = useDocumentState()

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = MOCK_CHATS.filter((chat) => {
    const query = searchQuery.toLowerCase().trim()
    return !query || chat.description.toLowerCase().includes(query)
  })

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
        />
      </Sidebar>
      <SidebarInset className="bg-transparent! h-[94vh] w-full">
        <div className="relative h-full w-full p-3 box-border bg-transparent">
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
                  chatTitle={MOCK_CHATS.find(c => c.id === selectedChatId)?.title}
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
                        onBack={goBackToList}
                        onClose={closeList}
                      />
                    ) : (
                      <DocumentList
                        documents={documents}
                        selectedDocumentId={selectedDocumentId}
                        onSelectDocument={selectDocument}
                        onClose={closeList}
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
