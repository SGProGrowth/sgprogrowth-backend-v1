import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { UserRole } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { JwtPayload } from '../../common/decorators/auth.decorator'

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  createAccessToken(payload: JwtPayload): string {
    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m'
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    })
  }

  createRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url')
    const hash = this.hashToken(token)
    const days = this.parseRefreshExpiresDays()
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return { token, hash, expiresAt }
  }

  private parseRefreshExpiresDays(): number {
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d'
    const match = /^(\d+)d$/.exec(raw.trim())
    return match ? Number(match[1]) : 7
  }

  hashToken(token: string): string {
    const pepper = this.config.get<string>('APP_SECRET')!
    return createHash('sha256').update(`${pepper}:${token}`).digest('hex')
  }

  buildPayload(input: {
    userId: string
    email: string
    roles: UserRole[]
    activeRole: UserRole
    organizationId: string
  }): JwtPayload {
    return {
      sub: input.userId,
      email: input.email,
      roles: input.roles,
      activeRole: input.activeRole,
      organizationId: input.organizationId,
    }
  }
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
