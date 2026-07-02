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

  app.use(
    helmet({
      contentSecurityPolicy: config.get('NODE_ENV') === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  )
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? ['http://localhost:5173'],
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SG Pro Growth LMS API')
    .setDescription('REST API for the SG Pro Growth learning platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  app.enableShutdownHooks()

  const port = config.get<number>('PORT') ?? 3000
  await app.listen(port)
  logger.log(`API running at http://localhost:${port}/${prefix}`)
  logger.log(`Swagger docs at http://localhost:${port}/docs`)
}

bootstrap()
