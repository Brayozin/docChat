import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ chatId: string }>
}

// GET /api/chats/[chatId]/messages - List messages
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        metadata: true
      }
    })

    return Response.json({
      messages: messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return Response.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/chats/[chatId]/messages - Create message
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { chatId } = await context.params
    const body = await req.json()
    const { role, content, metadata } = body

    if (!role || !content?.trim()) {
      return Response.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return Response.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

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

    const message = await prisma.message.create({
      data: {
        chatId,
        role,
        content: content.trim(),
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    return Response.json({
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return Response.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
