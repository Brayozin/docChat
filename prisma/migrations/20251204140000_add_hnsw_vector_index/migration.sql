-- CreateIndex
-- HNSW index for fast approximate nearest neighbor search on embeddings
CREATE INDEX "Chunk_embedding_idx" ON "Chunk" USING hnsw (embedding vector_cosine_ops);
