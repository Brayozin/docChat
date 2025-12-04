# Doc Chat

A Next.js-based RAG (Retrieval Augmented Generation) chat application that allows you to upload documents (PDF, Markdown) and ask questions about them using AI. Features vector-based semantic search with PostgreSQL + pgvector for intelligent document retrieval.

## Features

- **Document Upload**: Support for PDF and Markdown files with real-time progress tracking
- **Vector Search**: Semantic search using Ollama embeddings (nomic-embed-text) and pgvector HNSW indexing
- **Smart Chunking**: Documents split into 1000-character chunks with 200-character overlap
- **Hybrid Retrieval**: Vector search for documents with embeddings, full-text fallback for others
- **Document Selection**: Filter which documents to include in chat context
- **Background Processing**: Async embedding generation without blocking uploads
- **Streaming Responses**: Real-time AI responses using Server-Sent Events (SSE)
- **Multiple Chats**: Organize conversations with document-specific context

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with pgvector extension
- **AI/LLM**: Ollama (local LLM + embeddings)
- **Vector Search**: pgvector with HNSW indexing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+ with pgvector extension
- Ollama (for local LLM and embeddings)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install PostgreSQL and pgvector

**Fedora/RHEL:**
```bash
sudo dnf install postgresql16-server postgresql16-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

# Install pgvector
sudo dnf install pgvector_16
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-16-pgvector
```

### 3. Setup Database

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE docchat;
CREATE USER docchat_user WITH PASSWORD 'docchat_password';
GRANT ALL PRIVILEGES ON DATABASE docchat TO docchat_user;
ALTER USER docchat_user CREATEDB;  -- For Prisma shadow database
\c docchat
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 4. Install and Configure Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull llama2                # Chat model (or your preferred model)
ollama pull nomic-embed-text      # Embedding model (768 dimensions)
```

### 5. Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://docchat_user:docchat_password@localhost:5432/docchat"

# File Upload
UPLOAD_DIR="uploads"

# Ollama Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"           # Or deepseek-r1:8b, llama3, etc.

# Embedding Configuration
EMBEDDING_MODEL="nomic-embed-text"
EMBEDDING_DIMENSIONS="768"
EMBEDDING_BATCH_SIZE="10"       # Process 10 chunks at a time

# Retrieval Configuration
DEFAULT_TOP_K="5"               # Number of chunks to retrieve
MIN_CHUNKS="3"                  # Minimum chunks regardless of relevance
MAX_CONTEXT_LENGTH="10000"      # Max characters in context
```

### 6. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Create a Chat**: Click "New Chat" to start a conversation
2. **Upload Documents**: Click the paperclip icon to upload PDF or Markdown files
3. **Wait for Processing**: Documents are chunked and embeddings are generated in the background
4. **Ask Questions**: Type questions about your documents
5. **View Context**: Click the green "Context" section to see which chunks were used
6. **Filter Documents**: Use the Filter button to select specific documents for context

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat-stream/          # Streaming chat with RAG
│   │   └── chats/[chatId]/       # Chat and document management
│   ├── chats/                     # Chat UI page
│   └── page.tsx                   # Landing page
├── components/
│   ├── chat-interface.tsx         # Main chat UI with document selector
│   ├── document-selector.tsx      # Multi-select document filter
│   └── document-list.tsx          # Document sidebar
├── lib/
│   ├── embedding-service.ts       # Ollama embedding generation
│   ├── embedding-worker.ts        # Background embedding processor
│   ├── retrieval-service.ts       # Vector + full-text hybrid search
│   ├── ollama-client.ts           # Ollama LLM client
│   └── document-processor.ts      # PDF/Markdown text extraction
├── prisma/
│   └── schema.prisma              # Database schema (PostgreSQL + Chunk model)
└── hooks/
    └── use-chat-detail.ts         # Chat data and streaming hooks
```

## Troubleshooting

**Embeddings Failed:**
- Ensure Ollama is running: `ollama list`
- Check if nomic-embed-text is installed: `ollama pull nomic-embed-text`
- View logs in terminal for errors

**Vector Search Not Working:**
- Verify pgvector extension: `psql -U docchat_user -d docchat -c "SELECT * FROM pg_extension WHERE extname='vector';"`
- Check HNSW index exists: `\d "Chunk"` in psql

**Database Connection Issues:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env.local
- Ensure user has correct permissions

## How RAG Was Implemented

The RAG (Retrieval Augmented Generation) system follows this flow:

1. **Document Upload**: PDF/Markdown files are uploaded and text is extracted
2. **Chunking**: Documents are split into 1000-character chunks with 200-character overlap to preserve context at boundaries
3. **Embedding Generation**: Each chunk is embedded using Ollama's nomic-embed-text model (768 dimensions) in the background without blocking the upload
4. **Storage**: Embeddings are stored as vectors in PostgreSQL using the pgvector extension with HNSW indexing for fast similarity search
5. **Hybrid Retrieval**: When you ask a question:
   - Your question is embedded using the same model
   - Vector search finds the most semantically similar chunks from documents with embeddings
   - Full-text fallback retrieves chunks from documents still being processed
   - Top-K most relevant chunks (default 5) are selected
6. **Context Building**: Selected chunks are formatted and sent to the LLM along with your question
7. **Streaming Response**: The AI generates a response using the retrieved context, streaming it back in real-time

This approach dramatically reduces the amount of context sent to the LLM (90% reduction from full documents) while maintaining high relevance through semantic search.

## Technical Decisions

**Why PostgreSQL + pgvector over SQLite-vss?**
Initially considered sqlite-vss for simplicity, but PostgreSQL + pgvector offers better production readiness, native Prisma support, HNSW indexing (faster than IVFFlat), and better scalability for larger datasets. The migration was worth it for the performance gains.

**Why background async embedding generation?**
Embedding generation can take 10-30 seconds for longer documents. Running it asynchronously means users can continue uploading and chatting immediately without waiting. Documents work with full-text retrieval until embeddings are ready, then automatically upgrade to vector search.

**Why chunk-based retrieval instead of full documents?**
Sending entire documents to the LLM every time is inefficient and expensive. Smart chunking with semantic search means we only send the most relevant 5-10 chunks (usually 5,000 characters) instead of potentially 50,000+ characters. The AI gets exactly what it needs without the noise.

**Why Llama2?**
Chose Llama2 as the default chat model because it's the most performant on my machine, balancing quality and speed. The system works with any Ollama model though - you can easily switch to DeepSeek-R1, Llama3, or others via the .env config.

## Planned Improvements

### Document Viewer & Interaction
- **Real-time document viewer**: Side-by-side view of PDF/Markdown with highlighting of which chunks were used in responses
- **Context search from selection**: Highlight text in the document viewer to use as additional context or to search specific sections within chunks
- **Document-centric navigation**: Global document listing page showing all documents across chats, click any document to jump to its chat

### Chat Management
- **Chat editing**: Edit chat titles and add descriptions for better organization
- **Embedding chat context**: Index past conversation messages themselves, enabling semantic search across chat history ("what did we discuss about authentication?")

### File Handling
- **Batch upload**: Upload multiple files at once instead of one at a time
- **More file formats**: Support for DOCX, TXT, HTML, and other document types
- **Document comparison**: Diff view to compare changes between document versions

### UI/UX
- **Dark mode refinements**: Better color schemes and contrast ratios
- **Mobile responsive design**: Optimize layout and interactions for mobile devices
- **Chunk preview on hover**: See which specific chunks were used directly in the chat interface
- **Real-time document viewer**: Side-by-side view of PDF/Markdown with highlighting of which chunks were used in responses
- **Reasoning feature**: Add a reasoning feature to the chat interface
- **Chunk viewer**: Add a chunk viewer to the chat interface to display the chunks that were used in the response

## License

MIT
