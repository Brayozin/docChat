import fs from 'fs/promises'
import path from 'path'
import { STORAGE_CONFIG } from './config/storage'

export async function saveFile(
  chatId: string,
  documentId: string,
  file: File
): Promise<string> {
  const dir = path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.documentsDir,
    chatId
  )

  await fs.mkdir(dir, { recursive: true })

  const fileName = `${documentId}_${sanitizeFilename(file.name)}`
  const filePath = path.join(dir, fileName)

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  return filePath
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200)
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    // Ignore errors if file doesn't exist
  }
}

export async function getFilePath(
  chatId: string,
  documentId: string,
  filename: string
): Promise<string> {
  return path.join(
    STORAGE_CONFIG.baseDir,
    STORAGE_CONFIG.documentsDir,
    chatId,
    `${documentId}_${sanitizeFilename(filename)}`
  )
}
