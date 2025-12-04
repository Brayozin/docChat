import { NextRequest } from 'next/server'
import { generateChatResponse } from '@/lib/ollama-client'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    const stream = await generateChatResponse(
      [{ role: 'user', content: message || 'hi how are you?' }],
      undefined
    )

    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const chunk = part.message.content
            fullResponse += chunk

            // Log each chunk to see what we're getting
            console.log('RAW CHUNK:', JSON.stringify(chunk))

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk, fullResponse: fullResponse.substring(0, 100) })}\n\n`)
            )
          }

          console.log('FULL RESPONSE:', fullResponse)

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`)
          )
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
    console.error('Error in test stream:', error)
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
