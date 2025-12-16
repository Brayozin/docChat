import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

type RouteContext = {
  params: Promise<{ chatId: string; documentId: string }>
}

/**
 * GET /api/chats/[chatId]/documents/[documentId] - Get document details with content
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { chatId, documentId } = await context.params

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        chatId: true,
        name: true,
        originalName: true,
        type: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        contentText: true,
        processingStatus: true,
        processingError: true,
        embeddingStatus: true,
        embeddingError: true
      }
    })

    if (!document) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify document belongs to this chat
    if (document.chatId !== chatId) {
      return Response.json(
        { error: 'Document does not belong to this chat' },
        { status: 403 }
      )
    }

    return Response.json({
      id: document.id,
      chatId: document.chatId,
      name: document.name,
      originalName: document.originalName,
      type: document.type,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedAt: document.uploadedAt.toISOString(),
      contentText: document.contentText,
      processingStatus: document.processingStatus,
      processingError: document.processingError,
      embeddingStatus: document.embeddingStatus,
      embeddingError: document.embeddingError
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return Response.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

// DELETE /api/chats/[chatId]/documents/[documentId] - Delete document
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { chatId, documentId } = await context.params

    // Get document first to retrieve file path
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { filePath: true, chatId: true }
    })

    if (!document) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify document belongs to this chat
    if (document.chatId !== chatId) {
      return Response.json(
        { error: 'Document does not belong to this chat' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    await deleteFile(document.filePath)

    // Delete database record
    await prisma.document.delete({
      where: { id: documentId }
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting document:', error)
    return Response.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
