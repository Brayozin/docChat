import { ProgressEvent, ProcessingStatus } from '@/types/upload'

export class ProgressEmitter {
  private encoder = new TextEncoder()
  private lastEmitTime = 0
  private readonly throttleMs = 100

  constructor(private writer: WritableStreamDefaultWriter<Uint8Array>) {}

  private shouldEmit(): boolean {
    const now = Date.now()
    if (now - this.lastEmitTime >= this.throttleMs) {
      this.lastEmitTime = now
      return true
    }
    return false
  }

  async emitProgress(
    status: ProcessingStatus,
    progress: number,
    message?: string
  ): Promise<void> {
    if (!this.shouldEmit() && progress < 100) {
      return
    }

    const event: ProgressEvent = {
      type: 'progress',
      status,
      progress,
      message
    }

    await this.emit(event)
  }

  async emitComplete(documentId: string, name: string): Promise<void> {
    const event: ProgressEvent = {
      type: 'complete',
      documentId,
      name,
      progress: 100
    }

    await this.emit(event)
  }

  async emitError(error: string, message?: string): Promise<void> {
    const event: ProgressEvent = {
      type: 'error',
      error,
      message
    }

    await this.emit(event)
  }

  private async emit(event: ProgressEvent): Promise<void> {
    const data = `data: ${JSON.stringify(event)}\n\n`
    await this.writer.write(this.encoder.encode(data))
  }

  async close(): Promise<void> {
    await this.writer.close()
  }
}

export function createSSEStream(): {
  stream: ReadableStream
  emitter: ProgressEmitter
} {
  const stream = new ReadableStream({
    start(controller) {
      // Keep connection alive
    }
  })

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const emitter = new ProgressEmitter(writer)

  return { stream: readable, emitter }
}
