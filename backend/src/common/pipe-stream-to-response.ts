import type { Response } from 'express'
import { pipeline } from 'stream/promises'
import type { Readable } from 'stream'

export async function pipeStreamToResponse(stream: Readable, res: Response): Promise<void> {
  try {
    await pipeline(stream, res)
  } catch {
    if (!res.headersSent) {
      res.status(404).json({ message: 'File not found' })
    }
  }
}
