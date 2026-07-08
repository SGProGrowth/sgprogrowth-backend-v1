import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  const config = app.get(ConfigService)
  const logger = app.get(Logger)
  const isProduction = config.get<string>('NODE_ENV') === 'production'

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
      // API is consumed from a separate frontend origin — Safari blocks fetch when CORP is same-origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  const corsOrigins = (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (isProduction && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be set in production')
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })

  const prefix = config.get<string>('API_PREFIX') ?? 'api/v1'
  app.setGlobalPrefix(prefix)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SG Pro Growth LMS API')
      .setDescription('REST API for the SG Pro Growth learning platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }

  app.enableShutdownHooks()

  const port = config.get<number>('PORT') ?? 3000
  await app.listen(port)
  logger.log(`API running at http://localhost:${port}/${prefix}`)
  if (!isProduction) {
    logger.log(`Swagger docs at http://localhost:${port}/docs`)
  }
}

bootstrap()
