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

## License

MIT
