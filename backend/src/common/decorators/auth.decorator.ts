import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { UserRole } from '@prisma/client'

export const ROLES_KEY = 'roles'

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)

export interface JwtPayload {
  sub: string
  email: string
  roles: UserRole[]
  activeRole: UserRole
  organizationId: string
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>()
    return request.user
  },
)
