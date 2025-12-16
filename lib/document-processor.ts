import fs from 'fs/promises'

export async function extractText(
  filePath: string,
  type: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // For markdown files, read the text directly
    if (type === 'markdown') {
      onProgress?.(40)
      const text = await fs.readFile(filePath, 'utf-8')
      onProgress?.(60)
      return text
    }

    // For PDF files, we'll extract text dynamically when needed
    // This avoids build-time issues with pdf-parse
    if (type === 'pdf') {
      try {
        onProgress?.(40)
        // Dynamically import pdf-parse only when needed (at runtime)
        const pdfParseModule = await import('pdf-parse')
        const dataBuffer = await fs.readFile(filePath)
        onProgress?.(50)

        // Use the PDFParse class (v2 API)
        const { PDFParse } = pdfParseModule as any

        // Initialize parser with buffer data
        const parser = new PDFParse({ data: dataBuffer })

        // Extract text using getText() method
        const result = await parser.getText()
        onProgress?.(60)
        return result.text
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        return ''
      }
    }

    return ''
  } catch (error) {
    console.error('Error extracting text from document:', error)
    return ''
  }
}

export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  if (!text || text.length === 0) {
    return []
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    chunks.push(chunk)

    // Move forward by chunkSize minus overlap
    // This creates overlapping chunks for better context
    start = end - overlap

    // Prevent infinite loop if we're at the end
    if (start + overlap >= text.length) {
      break
    }
  }

  return chunks
}

/**
 * @param text - The text to clean.
 * @param preserveNewlines - Whether to preserve newlines (useful for markdown).
 * @returns The cleaned text.
 */
export function cleanText(text: string, preserveNewlines: boolean = false): string {
  const cleaned = preserveNewlines
    ? text
        // Remove excessive spaces (but keep newlines)
        .replace(/[^\S\r\n]+/g, ' ')
        // Normalize multiple newlines to max 2
        .replace(/\n{3,}/g, '\n\n')
        // Remove special characters that might cause issues
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    : text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters that might cause issues
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return cleaned.trim()
}
