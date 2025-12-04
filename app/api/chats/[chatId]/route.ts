import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ chatId: string }>
}

// GET /api/chats/[chatId] - Get chat details
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            metadata: true,
            createdAt: true
          }
        },
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            fileSize: true,
            uploadedAt: true
          }
        }
      }
    })

    if (!chat) {
      return Response.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    return Response.json({
      id: chat.id,
      title: chat.title,
      description: chat.description,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      messages: chat.messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString()
      })),
      documents: chat.documents.map(d => ({
        ...d,
        uploadedAt: d.uploadedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return Response.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    )
  }
}

// PATCH /api/chats/[chatId] - Update chat
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params
    const body = await req.json()
    const { title, description } = body

    const updateData: { title?: string; description?: string } = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description.trim()

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: updateData
    })

    return Response.json({
      id: chat.id,
      title: chat.title,
      description: chat.description,
      updatedAt: chat.updatedAt.toISOString()
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }
    console.error('Error updating chat:', error)
    return Response.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}

// DELETE /api/chats/[chatId] - Delete chat
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params

    await prisma.chat.delete({
      where: { id: chatId }
    })

    return new Response(null, { status: 204 })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting chat:', error)
    return Response.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}
