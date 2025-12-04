import { prisma } from '../lib/prisma'
import { startEmbeddingGeneration } from '../lib/embedding-worker'

async function retryEmbeddings() {
  const documentId = 'cmirktk97000xijvbhflp0zbx'

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: { orderBy: { chunkIndex: 'asc' } } }
  })

  if (!document) {
    console.log('Document not found')
    return
  }

  console.log(`Retrying embeddings for ${document.name} (${document.chunks.length} chunks)...`)

  await startEmbeddingGeneration(
    document.id,
    document.chunks.map(c => ({ id: c.id, content: c.content }))
  )

  console.log('Done! Check document embeddingStatus.')
  await prisma.$disconnect()
}

retryEmbeddings().catch(console.error)
