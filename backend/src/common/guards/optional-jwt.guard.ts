import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JwtPayload } from '../decorators/auth.decorator'

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>()
    if (!request.headers.authorization) return true
    return super.canActivate(context) as Promise<boolean>
  }

  handleRequest<TUser = JwtPayload | null>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser | null {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>()
    if (!request.headers.authorization) return null
    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentication required')
    }
    return user as TUser
  }
}
