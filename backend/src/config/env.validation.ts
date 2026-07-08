import { plainToInstance } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator'

enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.development

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string

  @IsString()
  @IsNotEmpty()
  APP_SECRET!: string

  @IsOptional()
  @IsString()
  REDIS_URL?: string

  @IsOptional()
  @IsString()
  E2E_TEST_MODE?: string
}

const PLACEHOLDER_SECRET_PATTERN =
  /change-me|your-.*-here|placeholder|example-secret|dev-secret-minimum/i

function assertSecret(name: string, value: string, minLength: number, isProd: boolean) {
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters${isProd ? ' in production' : ''}`)
  }
  if (isProd && PLACEHOLDER_SECRET_PATTERN.test(value)) {
    throw new Error(`${name} must not use a placeholder value`)
  }
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validated, { skipMissingProperties: false })
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`)
  }

  const isProd = validated.NODE_ENV === NodeEnv.production

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'APP_SECRET'] as const) {
    assertSecret(key, validated[key], isProd ? 32 : 16, isProd)
  }

  if (isProd) {
    if (!config.REDIS_URL) {
      throw new Error('REDIS_URL is required in production')
    }
    if (!config.CORS_ORIGIN) {
      throw new Error('CORS_ORIGIN is required in production')
    }
    if (config.E2E_TEST_MODE === 'true') {
      throw new Error('E2E_TEST_MODE must not be enabled in production')
    }
    if (config.SMTP_USE_ETHEREAL === 'true') {
      throw new Error('SMTP_USE_ETHEREAL must not be enabled in production')
    }

    const storageProvider = String(config.STORAGE_PROVIDER ?? 's3').toLowerCase()
    if (storageProvider === 's3') {
      for (const key of ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET'] as const) {
        const value = config[key]
        if (!value || String(value).trim().length === 0) {
          throw new Error(`${key} is required when STORAGE_PROVIDER=s3 in production`)
        }
      }
      const s3Secret = String(config.S3_SECRET_KEY ?? '')
      if (/dev_password|minio_dev|change-me/i.test(s3Secret)) {
        throw new Error('S3_SECRET_KEY must not use development placeholder values in production')
      }
    }

    if (config.MAIL_ENABLED !== 'false' && !config.SMTP_HOST && !config.SMTP_URL) {
      throw new Error('SMTP_HOST or SMTP_URL is required in production when MAIL_ENABLED is true')
    }
  }

  return config
}
