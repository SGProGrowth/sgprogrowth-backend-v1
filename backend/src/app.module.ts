import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { validateEnv } from './config/env.validation'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { AppCacheModule } from './cache/cache.module'
import { QueueModule } from './queue/queue.module'
import { WorkersModule } from './queue/workers.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { HealthModule } from './modules/health/health.module'
import { StudentsModule } from './modules/students/students.module'
import { InstructorsModule } from './modules/instructors/instructors.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { CoursesModule } from './modules/courses/courses.module'
import { EnrollmentsModule } from './modules/enrollments/enrollments.module'
import { AssignmentsModule } from './modules/assignments/assignments.module'
import { QuestionsModule } from './modules/questions/questions.module'
import { QuizzesModule } from './modules/quizzes/quizzes.module'
import { ProgressModule } from './modules/progress/progress.module'
import { CertificatesModule } from './modules/certificates/certificates.module'
import { BatchesModule } from './modules/batches/batches.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { MediaModule } from './modules/media/media.module'
import { StorageModule } from './modules/storage/storage.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
        customProps: (req) => ({
          requestId: (req as { requestId?: string }).requestId,
        }),
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
        },
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL')
        const useRedisThrottle =
          config.get<string>('THROTTLE_USE_REDIS') === 'true' && Boolean(redisUrl)
        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60_000,
              limit: Number(config.get<string>('THROTTLE_DEFAULT_LIMIT') ?? 120),
            },
            {
              name: 'auth',
              ttl: 60_000,
              limit: Number(config.get<string>('THROTTLE_AUTH_LIMIT') ?? 20),
            },
          ],
          storage: useRedisThrottle ? new ThrottlerStorageRedisService(redisUrl!) : undefined,
        }
      },
    }),
    RedisModule,
    AppCacheModule,
    QueueModule,
    WorkersModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    HealthModule,
    StudentsModule,
    InstructorsModule,
    CategoriesModule,
    CoursesModule,
    EnrollmentsModule,
    AssignmentsModule,
    QuestionsModule,
    QuizzesModule,
    ProgressModule,
    CertificatesModule,
    BatchesModule,
    AnalyticsModule,
    MediaModule,
    StorageModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*')
  }
}
