import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateChatResponse } from '@/lib/ollama-client'
import { RAGContext } from '@/types/upload'
import { hybridRetrieve } from '@/lib/retrieval-service'

export async function POST(req: NextRequest) {
  const abortSignal = req.signal

  try {
    const {
      chatId,
      message,
      topK = parseInt(process.env.DEFAULT_TOP_K || '5'),
      minChunks = parseInt(process.env.MIN_CHUNKS || '3'),
      documentIds
    } = await req.json()

    if (!chatId || !message?.trim()) {
      return Response.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      )
    }

    await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content: message.trim()
      }
    })

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            role: true,
            content: true
          }
        },
        documents: {
          where: { processingStatus: 'ready' },
          select: {
            id: true,
            name: true,
            embeddingStatus: true
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

    const targetDocIds = documentIds?.length > 0
      ? documentIds
      : chat.documents.map(d => d.id)

    const retrievedChunks = targetDocIds.length > 0
      ? await hybridRetrieve(message, targetDocIds, { topK, minChunks })
      : []

    console.log(`[Chat] Retrieved ${retrievedChunks.length} chunks:`, retrievedChunks.map(c =>
      `${c.documentName}[${c.chunkIndex}] (score: ${c.relevanceScore.toFixed(3)})`
    ).join(', '))

    const documentContext = retrievedChunks.length > 0
      ? retrievedChunks
          .map(chunk => `# ${chunk.documentName} (Chunk ${chunk.chunkIndex + 1})\n\n${chunk.content}`)
          .join('\n\n---\n\n')
      : undefined

    const usedDocumentsMap = new Map()

    retrievedChunks.forEach(chunk => {
      if (!usedDocumentsMap.has(chunk.documentId)) {
        usedDocumentsMap.set(chunk.documentId, {
          id: chunk.documentId,
          name: chunk.documentName,
          chunks: []
        })
      }
      usedDocumentsMap.get(chunk.documentId).chunks.push({
        index: chunk.chunkIndex,
        score: chunk.relevanceScore
      })
    })

    const usedDocuments = Array.from(usedDocumentsMap.values()).map(doc => ({
      id: doc.id,
      name: doc.name,
      chunksUsed: doc.chunks.map((c: { index: number; score: number }) => c.index),
      relevanceScore: Math.max(...doc.chunks.map((c: { index: number; score: number }) => c.score))
    }))

    const totalCharacters = documentContext?.length || 0

    // Generate streaming response
    const stream = await generateChatResponse(
      chat.messages.reverse().map(m => ({
        role: m.role,
        content: m.content
      })),
      documentContext || undefined
    )

    // Stream to client with reasoning separation
    const encoder = new TextEncoder()
    let fullResponse = ''
    let buffer = ''
    let inThinkTag = false
    let reasoning = ''
    let content = ''
    let aborted = false

    const readable = new ReadableStream({
      async start(controller) {
        // Listen for abort signal
        abortSignal.addEventListener('abort', () => {
          aborted = true
        })
        
        try {
          let chunkCount = 0
          for await (const part of stream) {
            // Check if aborted
            if (aborted) {
              break
            }
            // Handle both generate API (part.response) and chat API (part.message.content)
            const chunk = ('response' in part) ? part.response : part.message.content
            fullResponse += chunk
            buffer += chunk

            // Debug: log first few chunks to see raw output
            if (chunkCount < 5) {
              console.log(`Chunk ${chunkCount}:`, JSON.stringify(chunk))
              chunkCount++
            }

            // This part is for the reasoning feature that i dont implemented yet

            // Process buffer to detect <think> tags
            while (buffer.length > 0) {
              if (!inThinkTag) {
                const thinkStart = buffer.indexOf('<think>')

                if (thinkStart === -1) {
                  if (buffer.length > 10) {
                    const toSend = buffer.slice(0, -10)
                    buffer = buffer.slice(-10)
                    content += toSend

                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', chunk: toSend })}\n\n`)
                    )
                  }
                  break
                } else {
                  if (thinkStart > 0) {
                    const beforeThink = buffer.slice(0, thinkStart)
                    content += beforeThink
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', chunk: beforeThink })}\n\n`)
                    )
                  }

                  buffer = buffer.slice(thinkStart + 7)
                  inThinkTag = true

                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_start' })}\n\n`)
                  )
                }
              } else {
                const thinkEnd = buffer.indexOf('</think>')

                if (thinkEnd === -1) {
                  if (buffer.length > 10) {
                    const toSend = buffer.slice(0, -10)
                    buffer = buffer.slice(-10)
                    reasoning += toSend

                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', chunk: toSend })}\n\n`)
                    )
                  }
                  break
                } else {
                  const insideThink = buffer.slice(0, thinkEnd)
                  reasoning += insideThink

                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', chunk: insideThink })}\n\n`)
                  )

                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_end' })}\n\n`)
                  )

                  buffer = buffer.slice(thinkEnd + 8)
                  inThinkTag = false
                }
              }
            }
          }

          if (buffer.length > 0 && !aborted) {
            if (inThinkTag) {
              reasoning += buffer
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', chunk: buffer })}\n\n`)
              )
            } else {
              content += buffer
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'content', chunk: buffer })}\n\n`)
              )
            }
          }

          // Debug: log full response to check for tags
          console.log('=== FULL RESPONSE ===')
          console.log('Length:', fullResponse.length)
          console.log('Aborted:', aborted)
          console.log('Has <think>:', fullResponse.includes('<think>'))
          console.log('Has </think>:', fullResponse.includes('</think>'))
          console.log('First 200 chars:', fullResponse.substring(0, 200))
          console.log('Last 200 chars:', fullResponse.substring(Math.max(0, fullResponse.length - 200)))
          console.log('=====================')

          // Save assistant message with metadata (even if aborted, save partial response)
          if (content || fullResponse) {
            const ragContext: RAGContext | undefined = usedDocuments.length > 0
              ? {
                  documentsUsed: usedDocuments,
                  totalChunks: usedDocuments.length,
                  contextLength: totalCharacters
                }
              : undefined

            const metadata = {
              ...(reasoning && { reasoning }),
              ...(ragContext && { ragContext })
            }

            await prisma.message.create({
              data: {
                chatId,
                role: 'assistant',
                content: content || fullResponse,
                metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null
              }
            })
          }

          if (aborted) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, aborted: true })}\n\n`)
            )
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            )
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error in chat stream:', error)
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
