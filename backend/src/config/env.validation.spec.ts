import { validateEnv } from './env.validation'

describe('validateEnv', () => {
  const base = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://localhost/test',
    JWT_ACCESS_SECRET: 'dev-access-secret-minimum-32-chars',
    JWT_REFRESH_SECRET: 'dev-refresh-secret-minimum-32-chars',
  }

  it('accepts valid development config', () => {
    expect(() => validateEnv(base)).not.toThrow()
  })

  it('rejects short JWT secrets in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'short',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/)
  })

  it('rejects placeholder secrets in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'change-me-access-secret-min-32-chars-long',
        JWT_REFRESH_SECRET: 'prod-refresh-secret-minimum-32-characters',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toThrow(/placeholder/)
  })

  it('requires REDIS_URL in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
      }),
    ).toThrow(/REDIS_URL/)
  })
})
