import { pipeStreamToResponse } from '../../common/pipe-stream-to-response'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import type { Request, Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import {
  InstructorCertificatesQueryDto,
  IssueCertificateDto,
  ReissueCertificateDto,
  RevokeCertificateDto,
  UpdateCertificateRulesDto,
} from '../../common/dto/certificate.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { CertificatesService } from './certificates.service'

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Get('me')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'List certificates for the current student' })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.certificatesService.listStudentCertificates(user.sub)
  }

  @Get('mine')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'List certificates issued for instructor courses' })
  listInstructor(
    @CurrentUser() user: JwtPayload,
    @Query() query: InstructorCertificatesQueryDto,
  ) {
    return this.certificatesService.listInstructorCertificates(user.sub, query)
  }

  @Get('templates')
  @Roles(UserRole.instructor)
  listTemplates(@CurrentUser() user: JwtPayload) {
    return this.certificatesService.listTemplates(user.sub)
  }

  @Get('courses/:courseSlug/rules')
  @Roles(UserRole.instructor)
  getRules(@Param('courseSlug') courseSlug: string, @CurrentUser() user: JwtPayload) {
    return this.certificatesService.getCourseRules(user.sub, courseSlug)
  }

  @Put('courses/:courseSlug/rules')
  @Roles(UserRole.instructor)
  updateRules(
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCertificateRulesDto,
  ) {
    return this.certificatesService.updateCourseRules(user.sub, courseSlug, dto)
  }

  @Post('issue')
  @Roles(UserRole.instructor)
  issue(@CurrentUser() user: JwtPayload, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issueCertificate(user.sub, dto)
  }

  @Get(':id/history')
  @Roles(UserRole.student, UserRole.instructor)
  history(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.certificatesService.getCertificateHistory(id, user.sub)
  }

  @Get(':id/pdf')
  @Roles(UserRole.student, UserRole.instructor)
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.certificatesService.getCertificatePdf(
      id,
      user.sub,
      user.activeRole,
    )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    await pipeStreamToResponse(stream, res)
  }

  @Get(':id')
  @Roles(UserRole.student, UserRole.instructor)
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.certificatesService.getCertificateDetail(id, user.sub, user.activeRole)
  }

  @Post(':id/revoke')
  @Roles(UserRole.instructor)
  revoke(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RevokeCertificateDto,
  ) {
    return this.certificatesService.revokeCertificate(user.sub, id, dto)
  }

  @Post(':id/reissue')
  @Roles(UserRole.instructor)
  reissue(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReissueCertificateDto,
  ) {
    return this.certificatesService.reissueCertificate(user.sub, id, dto)
  }
}

@ApiTags('certificates')
@Controller('certificates/verify')
export class CertificateVerifyController {
  constructor(private certificatesService: CertificatesService) {}

  @Get(':credentialId')
  @ApiOperation({ summary: 'Public certificate verification' })
  verify(@Param('credentialId') credentialId: string, @Req() req: Request) {
    return this.certificatesService.verifyCredential(credentialId, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })
  }
}
