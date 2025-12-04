-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentText" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'ready',
    "processingError" TEXT,
    "textChunks" TEXT,
    CONSTRAINT "Document_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("chatId", "contentText", "filePath", "fileSize", "id", "mimeType", "name", "originalName", "type", "uploadedAt") SELECT "chatId", "contentText", "filePath", "fileSize", "id", "mimeType", "name", "originalName", "type", "uploadedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_filePath_key" ON "Document"("filePath");
CREATE INDEX "Document_chatId_idx" ON "Document"("chatId");
CREATE INDEX "Document_uploadedAt_idx" ON "Document"("uploadedAt");
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "Document_processingStatus_idx" ON "Document"("processingStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
