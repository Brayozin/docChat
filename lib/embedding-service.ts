import { ollama } from './ollama-client'

export const EMBEDDING_CONFIG = {
  model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '768'),
  batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '10')
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await ollama.embeddings({
    model: EMBEDDING_CONFIG.model,
    prompt: text
  })

  return response.embedding
}

export async function generateEmbeddings(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
    const batch = texts.slice(i, i + EMBEDDING_CONFIG.batchSize)
    const batchEmbeddings = await Promise.all(batch.map(generateEmbedding))
    embeddings.push(...batchEmbeddings)
    onProgress?.(Math.min(i + batch.length, texts.length), texts.length)
  }

  return embeddings
}
