import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { CurrentUser, JwtPayload } from '../../common/decorators/auth.decorator'
import { ThrottleLimits } from '../../config/throttle.constants'
import {
  AuthTokensDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterResponseDto,
  ApiMessageDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailQueryDto,
} from '../../common/dto/auth.dto'
import { ChangePasswordDto } from '../../common/dto/profile.dto'
import { JwtAuthGuard } from '../../common/guards/auth.guards'
import { AuthService } from './auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: ThrottleLimits.register })
  @ApiOperation({ summary: 'Create a new account and send verification email' })
  register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: ThrottleLimits.login })
  @ApiOperation({ summary: 'Sign in and receive access + refresh tokens' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthTokensDto> {
    return this.authService.login({
      ...dto,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    })
  }

  @Get('verify-email')
  @Throttle({ default: ThrottleLimits.verifyEmail })
  @ApiOperation({ summary: 'Verify email address using token from email link' })
  verifyEmail(@Query() query: VerifyEmailQueryDto) {
    return this.authService.verifyEmail(query.token)
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: ThrottleLimits.resendVerification })
  @ApiOperation({ summary: 'Resend email verification link' })
  resendVerification(@Body() dto: ResendVerificationDto): Promise<ApiMessageDto> {
    return this.authService.resendVerification(dto.email)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: ThrottleLimits.forgotPassword })
  @ApiOperation({ summary: 'Request password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ApiMessageDto> {
    return this.authService.forgotPassword(dto.email)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: ThrottleLimits.resetPassword })
  @ApiOperation({ summary: 'Reset password using token from email link' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiMessageDto> {
    return this.authService.resetPassword(dto.token, dto.password)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: ThrottleLimits.refresh })
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refresh(dto.refreshToken)
  }

  @Get('test/token')
  @ApiOperation({ summary: 'E2E test helper — retrieve last auth token (dev only)' })
  async getTestToken(@Query('email') email: string, @Query('type') type: 'verify' | 'reset') {
    return this.authService.getTestToken(email, type)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: ThrottleLimits.logout })
  @ApiOperation({ summary: 'Revoke refresh token' })
  logout(@Body() dto: RefreshTokenDto): Promise<ApiMessageDto> {
    return this.authService.logout(dto.refreshToken)
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: ThrottleLimits.changePassword })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub, user.activeRole)
  }
}
