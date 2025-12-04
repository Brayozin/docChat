import { prisma } from './prisma'
import { generateEmbedding } from './embedding-service'
import { Prisma } from '@prisma/client'

export interface RetrievalOptions {
  topK?: number
  minChunks?: number
  documentIds?: string[]
}

export interface RetrievedChunk {
  id: string
  documentId: string
  documentName: string
  chunkIndex: number
  content: string
  relevanceScore: number
}

export async function retrieveRelevantChunks(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const {
    topK = parseInt(process.env.DEFAULT_TOP_K || '5'),
    minChunks = parseInt(process.env.MIN_CHUNKS || '3'),
    documentIds
  } = options

  console.log(`[Retrieval] Vector search - topK: ${topK}, minChunks: ${minChunks}, docIds: ${documentIds?.join(', ')}`)

  const queryEmbedding = await generateEmbedding(query)
  const vectorString = `[${queryEmbedding.join(',')}]`

  const documentFilter = documentIds && documentIds.length > 0
    ? Prisma.sql`AND c."documentId" IN (${Prisma.join(documentIds)})`
    : Prisma.empty

  const limit = Math.max(topK, minChunks)

  const results = await prisma.$queryRaw<Array<{
    id: string
    documentId: string
    documentName: string
    chunkIndex: number
    content: string
    distance: number
  }>>`
    SELECT
      c.id,
      c."documentId",
      d.name as "documentName",
      c."chunkIndex",
      c.content,
      c.embedding <=> ${vectorString}::vector as distance
    FROM "Chunk" c
    INNER JOIN "Document" d ON c."documentId" = d.id
    WHERE c."hasEmbedding" = true
      ${documentFilter}
    ORDER BY c.embedding <=> ${vectorString}::vector
    LIMIT ${limit}
  `

  console.log(`[Retrieval] Vector search returned ${results.length} chunks`)

  return results.map(r => ({
    id: r.id,
    documentId: r.documentId,
    documentName: r.documentName,
    chunkIndex: r.chunkIndex,
    content: r.content,
    relevanceScore: 1 - r.distance
  }))
}

export async function retrieveAllChunks(
  documentIds: string[],
  topK: number = 5
): Promise<RetrievedChunk[]> {
  console.log(`[Retrieval] Full-text fallback - fetching up to ${topK} chunks for docs: ${documentIds.join(', ')}`)

  const chunks = await prisma.chunk.findMany({
    where: { documentId: { in: documentIds } },
    include: {
      document: { select: { id: true, name: true } }
    },
    orderBy: [
      { documentId: 'asc' },
      { chunkIndex: 'asc' }
    ],
    take: topK
  })

  console.log(`[Retrieval] Full-text fallback returned ${chunks.length} chunks`)

  return chunks.map(chunk => ({
    id: chunk.id,
    documentId: chunk.documentId,
    documentName: chunk.document.name,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    relevanceScore: 1.0
  }))
}

export async function hybridRetrieve(
  query: string,
  documentIds: string[],
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const topK = options.topK || parseInt(process.env.DEFAULT_TOP_K || '5')

  console.log(`[Retrieval] Hybrid retrieve - query: "${query.substring(0, 50)}...", docIds: ${documentIds.join(', ')}`)

  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      processingStatus: 'ready'
    },
    select: { id: true, embeddingStatus: true, name: true }
  })

  console.log(`[Retrieval] Documents status: ${documents.map(d => `${d.name}: ${d.embeddingStatus}`).join(', ')}`)

  const withEmbeddings = documents
    .filter(d => d.embeddingStatus === 'completed')
    .map(d => d.id)

  const withoutEmbeddings = documents
    .filter(d => d.embeddingStatus !== 'completed')
    .map(d => d.id)

  console.log(`[Retrieval] With embeddings: ${withEmbeddings.length}, Without: ${withoutEmbeddings.length}`)

  const vectorResults = withEmbeddings.length > 0
    ? await retrieveRelevantChunks(query, { ...options, documentIds: withEmbeddings })
    : []

  const fullTextResults = withoutEmbeddings.length > 0
    ? await retrieveAllChunks(withoutEmbeddings, topK)
    : []

  const combined = [...vectorResults, ...fullTextResults]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK)

  console.log(`[Retrieval] Final result: ${combined.length} chunks from ${new Set(combined.map(c => c.documentId)).size} documents`)

  return combined
}
