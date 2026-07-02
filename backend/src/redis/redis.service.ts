import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  readonly client: Redis | null

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL')
    if (!url) {
      this.client = null
      this.logger.warn('REDIS_URL not set — Redis features disabled')
      return
    }
    this.client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    })
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`))
    this.logger.log('Redis connected')
  }

  isAvailable(): boolean {
    return this.client?.status === 'ready'
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false
    try {
      return (await this.client.ping()) === 'PONG'
    } catch {
      return false
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || !keys.length) return
    await this.client.del(...keys)
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.client) return 0
    const keys = await this.client.keys(pattern)
    if (!keys.length) return 0
    await this.client.del(...keys)
    return keys.length
  }

  onModuleDestroy() {
    void this.client?.quit()
  }
}
