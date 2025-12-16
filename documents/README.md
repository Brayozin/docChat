# Documentation Directory

Welcome to the Document Chat application documentation.

## Available Documentation

### 📚 [Project Setup Guide](./PROJECT_SETUP.md)
**Comprehensive guide covering everything:**
- Complete project overview
- What was implemented and why
- Tech stack details
- Database setup and schema
- API endpoints explained
- Ollama installation and configuration
- Environment variables
- Troubleshooting guide
- Project structure
- Future improvements

**Read this if:** You want to understand the entire project, set it up from scratch, or troubleshoot issues.

---

### 🚀 [Quick Start Guide](./QUICK_START.md)
**Get up and running in 5 minutes:**
- Prerequisites checklist
- Installation steps
- First-time setup
- Quick verification tests
- Common commands
- Quick troubleshooting

**Read this if:** You just want to get the app running quickly.

---

### 🔌 [API Reference](./API_REFERENCE.md)
**Complete REST API documentation:**
- All endpoints with examples
- Request/response formats
- Status codes
- Error handling
- Data types
- Example workflows
- cURL examples

**Read this if:** You're developing against the API or integrating with the backend.

---

### 🧠 [Reasoning Feature Guide](./REASONING_FEATURE.md)
**DeepSeek-R1 reasoning display:**
- How the reasoning feature works
- Backend tag detection and parsing
- Frontend streaming and display
- Collapsible reasoning UI
- Usage examples and testing
- Troubleshooting guide

**Read this if:** You're using DeepSeek-R1 models and want to see the AI's thinking process.

---

### ⚙️ [Chat Architecture Guide](./CHAT_ARCHITECTURE.md)
**Technical deep dive into chat implementation:**
- Complete message flow (user → AI → UI)
- How streaming works (SSE, ReadableStream, async iterators)
- Database organization and relationships
- Model context management (memory, history, documents)
- Code walkthrough with line-by-line explanations
- Visual flow diagrams

**Read this if:** You want to understand how the chat system works internally, how streaming is implemented, or how messages are organized.

---

## Quick Navigation

### Getting Started
1. First time? → [Quick Start Guide](./QUICK_START.md)
2. Need details? → [Project Setup Guide](./PROJECT_SETUP.md)
3. Building features? → [API Reference](./API_REFERENCE.md)
4. Using DeepSeek? → [Reasoning Feature Guide](./REASONING_FEATURE.md)
5. Understanding internals? → [Chat Architecture Guide](./CHAT_ARCHITECTURE.md)

### Common Tasks

**Install Ollama:**
```bash
# See: Quick Start Guide - Section 1
curl -fsSL https://ollama.com/install.sh | sh
```

**Setup Database:**
```bash
# See: Project Setup Guide - Database Setup
npx prisma generate
npx prisma db push
```

**Test API:**
```bash
# See: API Reference - Testing section
curl http://localhost:3000/api/chats
```

**Troubleshooting:**
- Quick fixes → [Quick Start - Troubleshooting](./QUICK_START.md#troubleshooting-quick-fixes)
- Detailed solutions → [Project Setup - Troubleshooting](./PROJECT_SETUP.md#troubleshooting)

---

## Documentation Structure

```
documents/
├── README.md              # This file - navigation guide
├── PROJECT_SETUP.md       # Complete setup and configuration guide
├── QUICK_START.md         # 5-minute getting started guide
├── API_REFERENCE.md       # REST API documentation
├── REASONING_FEATURE.md   # DeepSeek reasoning feature guide
└── CHAT_ARCHITECTURE.md   # Chat implementation deep dive
```

---

## Key Technologies

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **LLM**: Ollama (local), DeepSeek-R1 / Llama 2 / Mistral
- **File Processing**: pdf-parse for PDF text extraction
- **Real-time**: Server-Sent Events (SSE) for streaming
- **Reasoning**: DeepSeek-R1 thinking process display

---

## Project Summary

This is a document-based chatbot where you can:
1. Create multiple chat sessions
2. Upload PDF or Markdown documents to each chat
3. Ask questions about your documents
4. Get AI-powered responses with document context
5. All data stays local (SQLite + local file storage)
6. All AI processing is local (Ollama)

---

## Important Files Reference

### Configuration
- `.env.local` - Environment variables
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies

### Core Application
- `app/api/` - API routes
- `lib/prisma.ts` - Database client
- `lib/ollama-client.ts` - LLM client
- `lib/storage.ts` - File storage
- `lib/document-processor.ts` - Text extraction

### Frontend
- `app/chats/page.tsx` - Main chat UI
- `components/chat-interface.tsx` - Chat component
- `hooks/use-chats.ts` - Chat management
- `hooks/use-chat-detail.ts` - Message & streaming

---

## Quick Reference

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
UPLOAD_DIR="uploads"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="deepseek-r1:8b"  # Or llama2, mistral, etc.
```

### Common Commands
```bash
npm run dev                  # Start development server
npx prisma generate          # Generate Prisma client
npx prisma db push           # Update database schema
npx prisma studio            # Open database GUI
ollama serve                 # Start Ollama
ollama pull deepseek-r1:8b   # Download DeepSeek-R1 (reasoning model)
ollama pull llama2           # Download Llama 2
```

### API Endpoints Quick List
```
GET    /api/chats                              # List chats
POST   /api/chats                              # Create chat
GET    /api/chats/[id]                         # Get chat details
PUT    /api/chats/[id]                         # Update chat
DELETE /api/chats/[id]                         # Delete chat

GET    /api/chats/[id]/messages                # List messages
POST   /api/chats/[id]/messages                # Create message
DELETE /api/chats/[id]/messages/[messageId]    # Delete message

GET    /api/chats/[id]/documents               # List documents
POST   /api/chats/[id]/documents               # Upload document
DELETE /api/chats/[id]/documents/[documentId]  # Delete document

POST   /api/chat-stream                        # Stream chat (SSE)
```

---

## Need Help?

1. **Setup Issues**: Check [Troubleshooting section](./PROJECT_SETUP.md#troubleshooting)
2. **API Questions**: See [API Reference](./API_REFERENCE.md)
3. **Ollama Issues**: See [Ollama Configuration](./PROJECT_SETUP.md#ollama-configuration)
4. **Quick Fixes**: See [Quick Start Troubleshooting](./QUICK_START.md#troubleshooting-quick-fixes)

---

## External Resources

- **Ollama**: https://ollama.com
- **Ollama Models**: https://ollama.com/library
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Version**: 1.0.0
**Last Updated**: December 15, 2025
**Status**: Development
