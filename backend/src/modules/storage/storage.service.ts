import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs'
import { unlink } from 'fs/promises'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

export type StorageProvider = 'local' | 's3'

export type SaveOptions = {
  contentType?: string
  visibility?: 'public' | 'private'
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name)
  private readonly uploadRoot: string
  private readonly provider: StorageProvider
  private readonly s3?: S3Client
  private readonly bucket: string
  private readonly signedUrlTtl: number

  constructor(private config: ConfigService) {
    this.uploadRoot = this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads')
    const explicit = this.config.get<string>('STORAGE_PROVIDER')?.toLowerCase()
    if (explicit === 'local' || explicit === 's3') {
      this.provider = explicit
    } else {
      this.provider = this.config.get<string>('S3_ENDPOINT') ? 's3' : 'local'
    }
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'sgpg-lms'
    this.signedUrlTtl = Number(this.config.get<string>('S3_SIGNED_URL_TTL_SECONDS') ?? 3600)

    if (this.provider === 'local') {
      if (!existsSync(this.uploadRoot)) mkdirSync(this.uploadRoot, { recursive: true })
    } else {
      const endpoint = this.config.get<string>('S3_ENDPOINT')
      const region = this.config.get<string>('S3_REGION') ?? 'us-east-1'
      const useSsl = this.config.get<string>('S3_USE_SSL') === 'true'
      this.s3 = new S3Client({
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: Boolean(endpoint),
        credentials: {
          accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? '',
          secretAccessKey: this.config.get<string>('S3_SECRET_KEY') ?? '',
        },
        tls: useSsl,
      })
    }
  }

  async onModuleInit() {
    if (this.provider !== 's3' || !this.s3) return
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }))
        this.logger.log(`Created S3 bucket: ${this.bucket}`)
      } catch (err) {
        this.logger.warn(`Could not ensure bucket ${this.bucket}: ${err}`)
      }
    }
    this.logger.log(`Storage provider: s3 (bucket=${this.bucket})`)
  }

  getProvider(): StorageProvider {
    return this.provider
  }

  buildKey(prefix: string, filename: string): string {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
    return `${prefix}/${randomUUID()}-${safeName}`
  }

  absolutePath(storageKey: string): string {
    return join(this.uploadRoot, storageKey)
  }

  async saveBuffer(storageKey: string, buffer: Buffer, options?: SaveOptions): Promise<void> {
    if (this.provider === 's3' && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: options?.contentType,
          ACL: options?.visibility === 'public' ? 'public-read' : undefined,
        }),
      )
      return
    }

    const target = this.absolutePath(storageKey)
    const dir = dirname(target)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    await pipeline(Readable.from(buffer), createWriteStream(target))
  }

  async openReadStream(storageKey: string): Promise<Readable> {
    if (this.provider === 's3' && this.s3) {
      try {
        const res = await this.s3.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
        )
        const body = res.Body
        if (!body || typeof (body as Readable).pipe !== 'function') {
          throw new NotFoundException('File not found')
        }
        const stream = body as Readable
        stream.on('error', () => {
          /* handled by pipeline in controllers */
        })
        return stream
      } catch (err: unknown) {
        const code = (err as { Code?: string; name?: string }).Code ?? (err as { name?: string }).name
        const localPath = this.absolutePath(storageKey)
        if ((code === 'NoSuchKey' || code === 'NotFound') && existsSync(localPath)) {
          this.logger.debug(`S3 miss for ${storageKey}; serving from local fallback`)
          return createReadStream(localPath)
        }
        if (err instanceof NotFoundException) throw err
        throw new NotFoundException('File not found')
      }
    }

    const target = this.absolutePath(storageKey)
    if (!existsSync(target)) throw new NotFoundException('File not found')
    return createReadStream(target)
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (this.provider === 's3' && this.s3) {
      await this.s3
        .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }))
        .catch((err) => this.logger.warn(`Failed to delete ${storageKey}: ${err}`))
      return
    }

    const target = this.absolutePath(storageKey)
    if (!existsSync(target)) return
    await unlink(target).catch((err) => {
      this.logger.warn(`Failed to delete ${storageKey}: ${err}`)
    })
  }

  async exists(storageKey: string): Promise<boolean> {
    if (this.provider === 's3' && this.s3) {
      try {
        await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }))
        return true
      } catch {
        return false
      }
    }
    return existsSync(this.absolutePath(storageKey))
  }

  async getSignedDownloadUrl(storageKey: string, expiresInSeconds?: number): Promise<string> {
    const ttl = expiresInSeconds ?? this.signedUrlTtl
    if (this.provider === 's3' && this.s3) {
      return getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
        { expiresIn: ttl },
      )
    }
    const apiPrefix = this.config.get<string>('API_PREFIX') ?? 'api/v1'
    const port = this.config.get<string>('PORT') ?? '3000'
    const base = this.config.get<string>('APP_URL') ?? `http://localhost:${port}`
    return `${base}/${apiPrefix}/media/local/${encodeURIComponent(storageKey)}?expires=${Date.now() + ttl * 1000}`
  }
}
