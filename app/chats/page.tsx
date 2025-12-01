"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useDocumentState } from "@/hooks/use-document-state"
import { DocumentToggleButton } from "@/components/document-toggle-button"
import { DocumentList } from "@/components/document-list"
import { DocumentViewer } from "@/components/document-viewer"

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

  return (
    <SidebarProvider className="bg-transparent">
      <Sidebar
        variant="floating"
        collapsible="icon"
        className="bg-transparent backdrop-blur-[1px] mt-20 h-[calc(100vh-10rem)] **:data-[sidebar=sidebar]:bg-transparent"
      >
        <SidebarContent className="p-4 bg-transparent">
          <SidebarTrigger />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-transparent!">
        <div className="relative flex h-[calc(100vh-10rem)] w-full items-center justify-center p-3 mt-20 bg-transparent">
          {!isListVisible && (
            <DocumentToggleButton onClick={toggleList} isActive={false} />
          )}

          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full rounded-lg border"
          >
            {/* Chat Section - Left */}
            <ResizablePanel defaultSize={isListVisible ? 50 : 100} minSize={30}>
              <div className="h-full bg-transparent backdrop-blur-[1px] flex items-center justify-center">
                <h1 className="text-2xl font-semibold text-muted-foreground">Chat</h1>
              </div>
            </ResizablePanel>

            {/* Documents Section - Right */}
            {isListVisible && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={20} maxSize={70}>
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
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
