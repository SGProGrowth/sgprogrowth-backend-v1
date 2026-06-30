import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthMailService } from './auth-mail.service'
import { JwtStrategy } from './jwt.strategy'
import { TokenService } from './token.service'
import { UsersModule } from '../users/users.module'
import { OrganizationsModule } from '../organizations/organizations.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET')
        if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured')
        const expiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m'
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
          },
        }
      },
    }),
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthMailService, JwtStrategy, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
