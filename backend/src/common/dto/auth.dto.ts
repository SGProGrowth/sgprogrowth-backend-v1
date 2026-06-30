import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'
import { UserRole } from '@prisma/client'
import { Type } from 'class-transformer'

export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20
}

export class ApiMessageDto {
  @ApiProperty()
  message!: string
}

export class RegisterDto {
  @ApiProperty({ example: 'Neha Sharma' })
  @IsString()
  @MinLength(1)
  name!: string

  @ApiProperty({ example: 'neha.sharma@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string

  @ApiProperty({ enum: [UserRole.student, UserRole.instructor] })
  @IsEnum(UserRole)
  role!: UserRole
}

export class LoginDto {
  @ApiProperty({ example: 'neha.sharma@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string

  @ApiProperty({ enum: [UserRole.student, UserRole.instructor] })
  @IsEnum(UserRole)
  role!: UserRole
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string
}

export class AuthUserDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  email!: string

  @ApiProperty({ enum: UserRole })
  role!: UserRole

  @ApiProperty()
  avatarInitials!: string

  @ApiProperty({ type: [String], enum: UserRole })
  roles!: UserRole[]

  @ApiProperty()
  organizationId!: string

  @ApiProperty()
  emailVerified!: boolean
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string

  @ApiProperty()
  refreshToken!: string

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto
}

export class RegisterResponseDto {
  @ApiProperty()
  message!: string

  @ApiProperty()
  email!: string

  @ApiProperty({ enum: UserRole })
  role!: UserRole

  @ApiProperty()
  requiresVerification!: boolean
}

export class VerifyEmailQueryDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  token!: string
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email!: string
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  token!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string
}
