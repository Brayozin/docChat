import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

type RouteContext = {
  params: Promise<{ chatId: string; documentId: string }>
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
