import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { HealthModule } from './modules/health/health.module'
import { StudentsModule } from './modules/students/students.module'
import { InstructorsModule } from './modules/instructors/instructors.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { CoursesModule } from './modules/courses/courses.module'
import { EnrollmentsModule } from './modules/enrollments/enrollments.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
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
    }),
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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
