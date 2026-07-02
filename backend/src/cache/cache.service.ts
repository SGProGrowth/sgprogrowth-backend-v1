import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private readonly memory = new Map<string, { value: string; expiresAt: number }>()

  constructor(private redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    if (this.redis.isAvailable()) {
      const raw = await this.redis.get(`cache:${key}`)
      if (!raw) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    }

    const entry = this.memory.get(key)
    if (!entry || entry.expiresAt < Date.now()) {
      this.memory.delete(key)
      return null
    }
    try {
      return JSON.parse(entry.value) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    const serialized = JSON.stringify(value)
    if (this.redis.isAvailable()) {
      await this.redis.set(`cache:${key}`, serialized, ttlSeconds)
      return
    }
    this.memory.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async invalidate(key: string): Promise<void> {
    if (this.redis.isAvailable()) {
      await this.redis.del(`cache:${key}`)
    }
    this.memory.delete(key)
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (this.redis.isAvailable()) {
      const count = await this.redis.delPattern(`cache:${prefix}*`)
      if (count) this.logger.debug(`Invalidated ${count} cache keys for prefix ${prefix}`)
    }
    for (const key of [...this.memory.keys()]) {
      if (key.startsWith(prefix)) this.memory.delete(key)
    }
  }
}
