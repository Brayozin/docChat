'use client'

import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'

interface PDFCanvasViewerProps {
  pdfUrl: string
  documentName: string
}

/**
 * @param pdfUrl - URL to the PDF file
 * @param documentName - Name of the document for display
 */
export function PDFCanvasViewer({ pdfUrl, documentName }: PDFCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize PDF.js worker
  useEffect(() => {
    // Use worker from public directory
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }, [])

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdfDoc = await loadingTask.promise
        
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(1)
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('Failed to load PDF document')
        setIsLoading(false)
      }
    }

    loadPDF()

    return () => {
      pdf?.destroy()
    }
  }, [pdfUrl])

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!
        
        const viewport = page.getViewport({ scale })
        
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }
        
        await page.render(renderContext).promise
      } catch (err) {
        console.error('Error rendering page:', err)
      }
    }

    renderPage()
  }, [pdf, currentPage, scale])

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground dark:text-rose-200">
          <Loader2 className="size-12 mx-auto mb-4 animate-spin dark:text-rose-300" />
          <p className="text-sm">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive dark:text-rose-400">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-rose-950/30 border-b border-border/50 dark:border-rose-300/30">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4 dark:text-rose-100" />
          </button>
          <span className="text-sm dark:text-rose-100 min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="size-4 dark:text-rose-100" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4 dark:text-rose-100" />
          </button>
          <span className="text-sm dark:text-rose-100 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4 dark:text-rose-100" />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 dark:bg-rose-950/10 p-4"
      >
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef}
            className="shadow-lg bg-white"
          />
        </div>
      </div>
    </div>
  )
}

