import { validateEnv } from './env.validation'

describe('validateEnv', () => {
  const base = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://localhost/test',
    JWT_ACCESS_SECRET: 'dev-access-secret-minimum-32-chars',
    JWT_REFRESH_SECRET: 'dev-refresh-secret-minimum-32-chars',
    APP_SECRET: 'dev-app-secret-minimum-32-characters-long',
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
        CORS_ORIGIN: 'https://app.example.com',
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
        APP_SECRET: 'prod-app-secret-minimum-32-characters-long',
        REDIS_URL: 'redis://localhost:6379',
        CORS_ORIGIN: 'https://app.example.com',
        SMTP_HOST: 'smtp.example.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
      }),
    ).toThrow(/placeholder/)
  })

  it('requires REDIS_URL in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).toThrow(/REDIS_URL/)
  })

  it('rejects E2E_TEST_MODE in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
        CORS_ORIGIN: 'https://app.example.com',
        E2E_TEST_MODE: 'true',
        SMTP_HOST: 'smtp.example.com',
      }),
    ).toThrow(/E2E_TEST_MODE/)
  })

  it('rejects Ethereal SMTP in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
        CORS_ORIGIN: 'https://app.example.com',
        SMTP_USE_ETHEREAL: 'true',
        SMTP_HOST: 'smtp.example.com',
      }),
    ).toThrow(/SMTP_USE_ETHEREAL/)
  })
})
