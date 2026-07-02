import { CacheService } from '../cache/cache.service'
import { RedisService } from '../redis/redis.service'

describe('CacheService', () => {
  const redis = {
    isAvailable: () => false,
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
  } as unknown as RedisService

  const cache = new CacheService(redis)

  it('stores and retrieves values in memory fallback', async () => {
    await cache.set('test-key', { foo: 'bar' }, 60)
    const value = await cache.get<{ foo: string }>('test-key')
    expect(value).toEqual({ foo: 'bar' })
  })

  it('returns null for missing keys', async () => {
    expect(await cache.get('missing')).toBeNull()
  })

  it('invalidates keys', async () => {
    await cache.set('delete-me', 1, 60)
    await cache.invalidate('delete-me')
    expect(await cache.get('delete-me')).toBeNull()
  })
})
