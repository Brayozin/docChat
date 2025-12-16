import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

type RouteContext = {
  params: Promise<{ chatId: string; documentId: string }>
}

/**
 * GET /api/chats/[chatId]/documents/[documentId]/file - Serve the actual PDF file
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { chatId, documentId } = await context.params

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        chatId: true,
        filePath: true,
        mimeType: true,
        name: true,
        type: true
      }
    })

    if (!document) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.chatId !== chatId) {
      return Response.json(
        { error: 'Document does not belong to this chat' },
        { status: 403 }
      )
    }

    if (document.type !== 'pdf') {
      return Response.json(
        { error: 'Only PDF files can be served' },
        { status: 400 }
      )
    }

    const absolutePath = path.isAbsolute(document.filePath)
      ? document.filePath
      : path.join(process.cwd(), document.filePath)

    const fileBuffer = await fs.readFile(absolutePath)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${document.name}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving PDF file:', error)
    return Response.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

