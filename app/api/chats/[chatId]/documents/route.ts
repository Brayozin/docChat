import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/storage'
import { extractText } from '@/lib/document-processor'
import { STORAGE_CONFIG } from '@/lib/config/storage'

type RouteContext = {
  params: Promise<{ chatId: string }>
}

// GET /api/chats/[chatId]/documents - List documents for a chat
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params

    const documents = await prisma.document.findMany({
      where: { chatId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        fileSize: true,
        uploadedAt: true
      }
    })

    return Response.json({
      documents: documents.map(d => ({
        ...d,
        uploadedAt: d.uploadedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return Response.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/chats/[chatId]/documents - Upload document
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params

    // Verify chat exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true }
    })

    if (!chat) {
      return Response.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > STORAGE_CONFIG.maxFileSize) {
      return Response.json(
        { error: `File too large. Maximum size is ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB` },
        { status: 413 }
      )
    }

    // Validate file type
    const mimeType = file.type
    const docType = STORAGE_CONFIG.allowedMimeTypes[mimeType]

    if (!docType) {
      return Response.json(
        { error: 'Invalid file type. Only PDF and Markdown files are allowed' },
        { status: 400 }
      )
    }

    // Create document record (without file path initially)
    const document = await prisma.document.create({
      data: {
        chatId,
        name: file.name,
        originalName: file.name,
        type: docType,
        filePath: '', // Will update after save
        fileSize: file.size,
        mimeType
      }
    })

    // Save file to disk
    const filePath = await saveFile(chatId, document.id, file)

    // Extract text content
    const contentText = await extractText(filePath, docType)

    // Update document with file path and content
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { filePath, contentText }
    })

    return Response.json({
      id: updatedDocument.id,
      chatId: updatedDocument.chatId,
      name: updatedDocument.name,
      type: updatedDocument.type,
      fileSize: updatedDocument.fileSize,
      uploadedAt: updatedDocument.uploadedAt.toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return Response.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
