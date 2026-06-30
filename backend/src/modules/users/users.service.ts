import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.module'
import { initialsFromName } from '../auth/token.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAuthUser(userId: string, activeRole: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        studentProfile: true,
        instructorProfile: true,
        organizationMembers: { include: { organization: true } },
      },
    })

    if (!user) throw new NotFoundException('User not found')

    const roles = user.roles.map((r) => r.role)
    const displayName =
      activeRole === UserRole.student
        ? user.studentProfile?.displayName
        : user.instructorProfile?.displayName

    const name = displayName ?? user.email.split('@')[0] ?? 'User'
    const org = user.organizationMembers[0]?.organization

    return {
      id: user.id,
      name,
      email: user.email,
      role: activeRole,
      avatarInitials: initialsFromName(name),
      roles,
      organizationId: org?.id ?? null,
      organization: org?.name ?? null,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      profile:
        activeRole === UserRole.student
          ? user.studentProfile
          : user.instructorProfile,
    }
  }
}
