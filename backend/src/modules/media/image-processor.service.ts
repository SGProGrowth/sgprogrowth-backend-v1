import { Injectable } from '@nestjs/common'
import sharp from 'sharp'
import { StorageService } from '../storage/storage.service'
import { isImageMime } from './media-validation'

export type ImageVariants = {
  thumbnail?: { key: string; width: number; height: number }
  medium?: { key: string; width: number; height: number }
  large?: { key: string; width: number; height: number }
}

@Injectable()
export class ImageProcessorService {
  constructor(private storage: StorageService) {}

  async processImage(
    prefix: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ width: number; height: number; variants: ImageVariants }> {
    if (!isImageMime(mimeType)) {
      return { width: 0, height: 0, variants: {} }
    }

    const meta = await sharp(buffer).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    const variants: ImageVariants = {}

    const thumbKey = this.storage.buildKey(`${prefix}/thumb`, filename)
    const thumbBuf = await sharp(buffer).resize(200, 200, { fit: 'inside' }).webp({ quality: 80 }).toBuffer()
    await this.storage.saveBuffer(thumbKey, thumbBuf, { contentType: 'image/webp', visibility: 'public' })
    variants.thumbnail = { key: thumbKey, width: 200, height: 200 }

    if (width > 800) {
      const mediumKey = this.storage.buildKey(`${prefix}/medium`, filename)
      const mediumBuf = await sharp(buffer).resize(800, 800, { fit: 'inside' }).webp({ quality: 85 }).toBuffer()
      await this.storage.saveBuffer(mediumKey, mediumBuf, { contentType: 'image/webp', visibility: 'public' })
      variants.medium = { key: mediumKey, width: 800, height: 800 }
    }

    if (width > 1600) {
      const largeKey = this.storage.buildKey(`${prefix}/large`, filename)
      const largeBuf = await sharp(buffer).resize(1600, 1600, { fit: 'inside' }).webp({ quality: 88 }).toBuffer()
      await this.storage.saveBuffer(largeKey, largeBuf, { contentType: 'image/webp', visibility: 'public' })
      variants.large = { key: largeKey, width: 1600, height: 1600 }
    }

    return { width, height, variants }
  }
}
