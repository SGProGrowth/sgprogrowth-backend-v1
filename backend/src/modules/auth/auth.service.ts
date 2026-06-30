import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import * as argon2 from 'argon2'
import { PrismaService } from '../../prisma/prisma.module'
import { OrganizationsService } from '../organizations/organizations.service'
import { UsersService } from '../users/users.service'
import { AuthMailService } from './auth-mail.service'
import { initialsFromName, TokenService } from './token.service'
import type { AuthTokensDto, RegisterResponseDto } from '../../common/dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
    private tokenService: TokenService,
    private authMail: AuthMailService,
    private config: ConfigService,
  ) {}

  private requireVerification(): boolean {
    return this.config.get<string>('REQUIRE_EMAIL_VERIFICATION') !== 'false'
  }

  async register(input: {
    name: string
    email: string
    password: string
    role: UserRole
  }): Promise<RegisterResponseDto> {
    if (input.role !== UserRole.student && input.role !== UserRole.instructor) {
      throw new ConflictException('Registration role must be student or instructor')
    }

    const email = input.email.trim().toLowerCase()
    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new ConflictException('An account with this email already exists')
    }

    const organization = await this.organizationsService.getDefaultOrganization()
    const passwordHash = await argon2.hash(input.password)
    const displayName = input.name.trim()
    const needsVerification = this.requireVerification()

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerifiedAt: needsVerification ? undefined : new Date(),
        roles: { create: { role: input.role } },
        organizationMembers: {
          create: { organizationId: organization.id, role: 'member' },
        },
        ...(input.role === UserRole.student
          ? {
              studentProfile: {
                create: { displayName, timezone: 'Asia/Kolkata' },
              },
            }
          : {
              instructorProfile: {
                create: {
                  displayName,
                  designation: 'Instructor',
                  title: 'Instructor',
                },
              },
            }),
      },
    })

    if (needsVerification) {
      await this.authMail.sendVerificationEmail(user.id, email, displayName)
      return {
        message: 'Account created. Please check your email to verify your address before signing in.',
        email,
        role: input.role,
        requiresVerification: true,
      }
    }

    await this.authMail.sendWelcomeEmail(email, displayName, input.role)

    return {
      message: 'Account created. You can sign in now.',
      email,
      role: input.role,
      requiresVerification: false,
    }
  }

  async verifyEmail(token: string): Promise<{ message: string; email: string }> {
    const hash = this.authMail.hashToken(token)
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash: hash, usedAt: null },
      include: {
        user: {
          include: {
            roles: true,
            studentProfile: true,
            instructorProfile: true,
          },
        },
      },
    })

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired')
    }

    const user = record.user
    const displayName =
      user.studentProfile?.displayName ??
      user.instructorProfile?.displayName ??
      user.email

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ])

    const primaryRole = user.roles[0]?.role ?? UserRole.student
    await this.authMail.sendWelcomeEmail(user.email, displayName, primaryRole)

    return {
      message: 'Email verified successfully. You can now sign in.',
      email: user.email,
    }
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: { studentProfile: true, instructorProfile: true },
    })

    if (!user || user.emailVerifiedAt) {
      return {
        message: 'If an unverified account exists for this email, a verification link has been sent.',
      }
    }

    const name =
      user.studentProfile?.displayName ??
      user.instructorProfile?.displayName ??
      user.email

    await this.authMail.sendVerificationEmail(user.id, user.email, name)

    return {
      message: 'If an unverified account exists for this email, a verification link has been sent.',
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: { studentProfile: true, instructorProfile: true },
    })

    const genericMessage =
      'If an account exists for this email, password reset instructions have been sent.'

    if (!user || user.status !== 'active') {
      return { message: genericMessage }
    }

    const name =
      user.studentProfile?.displayName ??
      user.instructorProfile?.displayName ??
      user.email

    await this.authMail.sendPasswordResetEmail(user.id, user.email, name)
    return { message: genericMessage }
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const hash = this.authMail.hashToken(token)
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash: hash, usedAt: null },
      include: { user: true },
    })

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired')
    }

    const passwordHash = await argon2.hash(password)

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ])

    return { message: 'Password updated successfully. You can now sign in with your new password.' }
  }

  async login(input: {
    email: string
    password: string
    role: UserRole
    userAgent?: string
    ipAddress?: string
  }): Promise<AuthTokensDto> {
    const email = input.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        studentProfile: true,
        instructorProfile: true,
        organizationMembers: { include: { organization: true } },
      },
    })

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password')
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password)
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password')
    }

    if (this.requireVerification() && !user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Please verify your email address before signing in. Check your inbox or request a new verification link.',
      )
    }

    const roles = user.roles.map((r) => r.role)
    if (!roles.includes(input.role)) {
      throw new UnauthorizedException(`This account is not registered as a ${input.role}`)
    }

    const organizationId =
      user.organizationMembers[0]?.organizationId ??
      (await this.organizationsService.getDefaultOrganization()).id

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.issueTokens({
      userId: user.id,
      email: user.email,
      roles,
      activeRole: input.role,
      organizationId,
      displayName:
        user.studentProfile?.displayName ??
        user.instructorProfile?.displayName ??
        email,
      emailVerified: Boolean(user.emailVerifiedAt),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    })
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    const hash = this.tokenService.hashToken(refreshToken)
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hash, revokedAt: null },
      include: {
        user: {
          include: {
            roles: true,
            studentProfile: true,
            instructorProfile: true,
            organizationMembers: true,
          },
        },
      },
    })

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const user = stored.user
    const roles = user.roles.map((r) => r.role)
    const activeRole =
      roles.includes(UserRole.instructor) && !roles.includes(UserRole.student)
        ? UserRole.instructor
        : roles[0] ?? UserRole.student

    const organizationId =
      user.organizationMembers[0]?.organizationId ??
      (await this.organizationsService.getDefaultOrganization()).id

    return this.issueTokens({
      userId: user.id,
      email: user.email,
      roles,
      activeRole,
      organizationId,
      displayName:
        user.studentProfile?.displayName ??
        user.instructorProfile?.displayName ??
        user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
    })
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const hash = this.tokenService.hashToken(refreshToken)
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return { message: 'Signed out successfully' }
  }

  async getMe(userId: string, activeRole: UserRole) {
    return this.usersService.getAuthUser(userId, activeRole)
  }

  private async issueTokens(input: {
    userId: string
    email: string
    roles: UserRole[]
    activeRole: UserRole
    organizationId: string
    displayName: string
    emailVerified: boolean
    userAgent?: string
    ipAddress?: string
  }): Promise<AuthTokensDto> {
    const payload = this.tokenService.buildPayload({
      userId: input.userId,
      email: input.email,
      roles: input.roles,
      activeRole: input.activeRole,
      organizationId: input.organizationId,
    })

    const accessToken = this.tokenService.createAccessToken(payload)
    const refresh = this.tokenService.createRefreshToken()

    await this.prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: refresh.hash,
        expiresAt: refresh.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
    })

    return {
      accessToken,
      refreshToken: refresh.token,
      user: {
        id: input.userId,
        name: input.displayName,
        email: input.email,
        role: input.activeRole,
        avatarInitials: initialsFromName(input.displayName),
        roles: input.roles,
        organizationId: input.organizationId,
        emailVerified: input.emailVerified,
      },
    }
  }
}
