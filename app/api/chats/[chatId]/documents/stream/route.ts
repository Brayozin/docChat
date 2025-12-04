import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/storage'
import { extractText, chunkText, cleanText } from '@/lib/document-processor'
import { STORAGE_CONFIG } from '@/lib/config/storage'
import { createSSEStream } from '@/lib/progress-emitter'

type RouteContext = {
  params: Promise<{ chatId: string }>
}

// POST /api/chats/[chatId]/documents/stream - Upload document with progress
export async function POST(req: NextRequest, context: RouteContext) {
  const { chatId } = await context.params

  // Create SSE stream
  const { stream, emitter } = createSSEStream()

  // Process upload in background
  ;(async () => {
    try {
      // Stage 1: Uploading - Validate and receive file
      await emitter.emitProgress('uploading', 10, 'Receiving file...')

      // Verify chat exists
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { id: true }
      })

      if (!chat) {
        await emitter.emitError('chat_not_found', 'Chat not found')
        await emitter.close()
        return
      }

      const formData = await req.formData()
      const file = formData.get('file') as File

      if (!file) {
        await emitter.emitError('no_file', 'No file provided')
        await emitter.close()
        return
      }

      // Validate file size
      if (file.size > STORAGE_CONFIG.maxFileSize) {
        await emitter.emitError(
          'file_too_large',
          `File too large. Maximum size is ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB`
        )
        await emitter.close()
        return
      }

      // Validate file type
      const mimeType = file.type
      const docType = STORAGE_CONFIG.allowedMimeTypes[mimeType]

      if (!docType) {
        await emitter.emitError(
          'invalid_file_type',
          'Invalid file type. Only PDF and Markdown files are allowed'
        )
        await emitter.close()
        return
      }

      await emitter.emitProgress('uploading', 20, 'Creating document record...')

      // Create document record with uploading status
      const document = await prisma.document.create({
        data: {
          chatId,
          name: file.name,
          originalName: file.name,
          type: docType,
          filePath: '', // Will update after save
          fileSize: file.size,
          mimeType,
          processingStatus: 'uploading'
        }
      })

      await emitter.emitProgress('uploading', 25, 'Saving file...')

      // Save file to disk
      const filePath = await saveFile(chatId, document.id, file)

      // Update document with file path
      await prisma.document.update({
        where: { id: document.id },
        data: { filePath, processingStatus: 'extracting' }
      })

      // Stage 2: Extracting - Extract text from document
      await emitter.emitProgress('extracting', 30, 'Extracting text...')

      const contentText = await extractText(filePath, docType, async (progress) => {
        await emitter.emitProgress('extracting', progress, 'Extracting text...')
      })

      if (!contentText) {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            processingStatus: 'error',
            processingError: 'Failed to extract text from document'
          }
        })
        await emitter.emitError('extraction_failed', 'Failed to extract text')
        await emitter.close()
        return
      }

      // Stage 3: Indexing - Process and chunk text
      await emitter.emitProgress('indexing', 65, 'Processing text...')

      // Clean the text
      const cleaned = cleanText(contentText)

      await emitter.emitProgress('indexing', 75, 'Chunking text...')

      // Chunk the text for future embeddings
      const chunks = chunkText(cleaned)

      await emitter.emitProgress('indexing', 85, 'Saving processed data...')

      // Update document with content and chunks
      const updatedDocument = await prisma.document.update({
        where: { id: document.id },
        data: {
          contentText: cleaned,
          textChunks: JSON.stringify(chunks),
          processingStatus: 'ready'
        }
      })

      await emitter.emitProgress('ready', 95, 'Finalizing...')

      // Stage 4: Complete
      await emitter.emitComplete(updatedDocument.id, updatedDocument.name)
      await emitter.close()

    } catch (error) {
      console.error('Error uploading document:', error)
      await emitter.emitError(
        'upload_failed',
        error instanceof Error ? error.message : 'Failed to upload document'
      )
      await emitter.close()
    }
  })()

  // Return SSE stream
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
