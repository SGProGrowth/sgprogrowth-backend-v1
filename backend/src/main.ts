import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(helmet())
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
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

  const port = config.get<number>('PORT') ?? 3000
  await app.listen(port)
  console.log(`API running at http://localhost:${port}/${prefix}`)
  console.log(`Swagger docs at http://localhost:${port}/docs`)
}

bootstrap()
