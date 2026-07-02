import { plainToInstance } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
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

  @IsOptional()
  @IsString()
  REDIS_URL?: string

  @IsOptional()
  @IsString()
  E2E_TEST_MODE?: string
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
  if (isProd) {
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      const value = validated[key]
      if (value.length < 32) {
        throw new Error(`${key} must be at least 32 characters in production`)
      }
      if (/change-me/i.test(value)) {
        throw new Error(`${key} must not use default placeholder in production`)
      }
    }
    if (!config.REDIS_URL) {
      throw new Error('REDIS_URL is required in production')
    }
  }

  return config
}
