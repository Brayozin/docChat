export const STORAGE_CONFIG = {
  baseDir: process.env.UPLOAD_DIR || 'uploads',
  documentsDir: 'documents',
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedMimeTypes: {
    'application/pdf': 'pdf',
    'text/markdown': 'markdown',
  } as Record<string, string>
}
