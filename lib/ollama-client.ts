import { Ollama } from 'ollama'

export const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
})

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  documentContext?: string
) {
  const systemMessage = documentContext
    ? {
        role: 'system',
        content: `You are a helpful assistant in a application called 'Doc Chat' that allows the user to upload documents and ask questions about them, you should use the following document context to answer questions:\n\n${documentContext}`
      }
    : null

  const allMessages = systemMessage
    ? [systemMessage, ...messages]
    : messages

  return await ollama.chat({
    model: process.env.OLLAMA_MODEL || 'llama2',
    messages: allMessages,
    stream: true,
    keep_alive: '30m'
  })
}
