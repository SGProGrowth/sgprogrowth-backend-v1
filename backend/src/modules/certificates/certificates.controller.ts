import { pipeStreamToResponse } from '../../common/pipe-stream-to-response'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { ThrottleLimits } from '../../config/throttle.constants'
import { UserRole } from '@prisma/client'
import type { Request, Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import {
  CreateCertificateTemplateDto,
  InstructorCertificatesQueryDto,
  IssueCertificateDto,
  ReissueCertificateDto,
  RevokeCertificateDto,
  UpdateCertificateRulesDto,
  UpdateCertificateTemplateDto,
} from '../../common/dto/certificate.dto'
import { multerMemoryOptions } from '../../common/multer-options'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { CertificateTemplatesService } from './certificate-templates.service'
import { CertificatesService } from './certificates.service'

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(
    private certificatesService: CertificatesService,
    private templatesService: CertificateTemplatesService,
  ) {}

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
  @Roles(UserRole.instructor, UserRole.org_admin)
  listTemplates(@CurrentUser() user: JwtPayload) {
    return this.certificatesService.listTemplates(user.sub, user.roles)
  }

  @Post('templates')
  @Roles(UserRole.instructor, UserRole.org_admin)
  createTemplate(@CurrentUser() user: JwtPayload, @Body() dto: CreateCertificateTemplateDto) {
    return this.templatesService.createTemplate(user.sub, user.roles, dto)
  }

  @Get('templates/:templateId')
  @Roles(UserRole.instructor, UserRole.org_admin)
  getTemplate(@CurrentUser() user: JwtPayload, @Param('templateId') templateId: string) {
    return this.templatesService.getTemplate(user.sub, user.roles, templateId)
  }

  @Patch('templates/:templateId')
  @Roles(UserRole.instructor, UserRole.org_admin)
  updateTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateCertificateTemplateDto,
  ) {
    return this.templatesService.updateTemplate(user.sub, user.roles, templateId, dto)
  }

  @Post('templates/:templateId/upload')
  @Roles(UserRole.instructor, UserRole.org_admin)
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  uploadTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('templateId') templateId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.templatesService.uploadTemplateVersion(user.sub, user.roles, templateId, file)
  }

  @Get('templates/:templateId/preview')
  @Roles(UserRole.instructor, UserRole.org_admin)
  async previewTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('templateId') templateId: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType, filename } = await this.templatesService.getTemplatePreviewStream(
      user.sub,
      user.roles,
      templateId,
    )
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    await pipeStreamToResponse(stream, res)
  }

  @Get('templates/:templateId/versions')
  @Roles(UserRole.instructor, UserRole.org_admin)
  listTemplateVersions(
    @CurrentUser() user: JwtPayload,
    @Param('templateId') templateId: string,
  ) {
    return this.templatesService.listTemplateVersions(user.sub, user.roles, templateId)
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
    )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    await pipeStreamToResponse(stream, res)
  }

  @Get(':id')
  @Roles(UserRole.student, UserRole.instructor)
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.certificatesService.getCertificateDetail(id, user.sub)
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
  @Throttle({ default: ThrottleLimits.certificateVerify })
  @ApiOperation({ summary: 'Public certificate verification' })
  verify(@Param('credentialId') credentialId: string, @Req() req: Request) {
    return this.certificatesService.verifyCredential(credentialId, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })
  }
}
