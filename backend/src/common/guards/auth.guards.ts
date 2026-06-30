import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { UserRole } from '@prisma/client'
import { ROLES_KEY, JwtPayload } from '../decorators/auth.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtPayload>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentication required')
    }
    return user
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles?.length) return true

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>()
    if (!user) throw new UnauthorizedException()

    const hasRole = requiredRoles.some((role) => user.roles.includes(role))
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}
