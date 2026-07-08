import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JwtPayload } from '../../common/decorators/auth.decorator'
import { PrismaService } from '../../prisma/prisma.module'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET')
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    })

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Authentication required')
    }

    const roles = user.roles.map((r) => r.role)
    if (!roles.includes(payload.activeRole)) {
      throw new UnauthorizedException('Authentication required')
    }

    return payload
  }
}
