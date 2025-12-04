import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/chats - Create new chat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description = '' } = body

    if (!title?.trim()) {
      return Response.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const chat = await prisma.chat.create({
      data: {
        title: title.trim(),
        description: description.trim()
      }
    })

    return Response.json(chat, { status: 201 })
  } catch (error) {
    console.error('Error creating chat:', error)
    return Response.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}

// GET /api/chats - List all chats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              messages: true,
              documents: true
            }
          }
        }
      }),
      prisma.chat.count()
    ])

    const formattedChats = chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      description: chat.description,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      lastMessage: chat.messages[0] ? {
        content: chat.messages[0].content,
        createdAt: chat.messages[0].createdAt.toISOString()
      } : undefined,
      messageCount: chat._count.messages,
      documentCount: chat._count.documents
    }))

    return Response.json({
      chats: formattedChats,
      total
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return Response.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}
