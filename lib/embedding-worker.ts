import { prisma } from './prisma'
import { generateEmbeddings, EMBEDDING_CONFIG } from './embedding-service'

export async function startEmbeddingGeneration(
  documentId: string,
  chunks: Array<{ id: string; content: string }>
): Promise<void> {
  try {
    console.log(`[Embedding] Starting for document ${documentId}`)

    await prisma.document.update({
      where: { id: documentId },
      data: { embeddingStatus: 'generating' }
    })

    const texts = chunks.map(c => c.content)
    const embeddings = await generateEmbeddings(texts, (current, total) => {
      console.log(`[Embedding] ${current}/${total} chunks`)
    })

    for (let i = 0; i < chunks.length; i++) {
      const vectorString = `[${embeddings[i].join(',')}]`

      await prisma.$executeRaw`
        UPDATE "Chunk"
        SET
          embedding = ${vectorString}::vector,
          "hasEmbedding" = true,
          "embeddingModel" = ${EMBEDDING_CONFIG.model},
          "embeddingDim" = ${EMBEDDING_CONFIG.dimensions}
        WHERE id = ${chunks[i].id}
      `
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        embeddingStatus: 'completed',
        embeddedAt: new Date()
      }
    })

    console.log(`[Embedding] Completed for document ${documentId}`)
  } catch (error) {
    console.error(`[Embedding] Failed:`, error)

    await prisma.document.update({
      where: { id: documentId },
      data: {
        embeddingStatus: 'failed',
        embeddingError: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}
