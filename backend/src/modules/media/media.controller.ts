import { pipeStreamToResponse } from '../../common/pipe-stream-to-response'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { MediaAssetType, UserRole } from '@prisma/client'
import type { Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { ThrottleLimits } from '../../config/throttle.constants'
import { MediaListQueryDto, MediaUploadBodyDto, SignedUrlQueryDto } from '../../common/dto/media.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { multerMemoryOptions, sanitizeContentDispositionFilename } from '../../common/multer-options'
import { MediaService } from './media.service'

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  @Roles(UserRole.student, UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  list(@CurrentUser() user: JwtPayload, @Query() query: MediaListQueryDto) {
    return this.mediaService.list(user.sub, user.activeRole, query)
  }

  @Get('stats')
  @Roles(UserRole.student, UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  stats(@CurrentUser() user: JwtPayload) {
    return this.mediaService.getStats(user.sub, user.activeRole)
  }

  @Post('upload')
  @Roles(UserRole.student, UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: MediaUploadBodyDto,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.mediaService.upload(user.sub, user.activeRole, body.assetType, file, {
      courseSlug: body.courseSlug,
      batchId: body.batchId,
      lessonId: body.lessonId,
      replaceAssetId: body.replaceAssetId,
    })
  }

  @Post('upload/batch')
  @Roles(UserRole.student, UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, multerMemoryOptions))
  uploadMany(
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: MediaUploadBodyDto,
  ) {
    if (!files?.length) throw new BadRequestException('At least one file is required')
    return this.mediaService.uploadMany(user.sub, user.activeRole, body.assetType, files, {
      courseSlug: body.courseSlug,
      batchId: body.batchId,
      lessonId: body.lessonId,
    })
  }

  @Post('avatars')
  @Roles(UserRole.student, UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  uploadAvatar(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required')
    return this.mediaService.upload(user.sub, user.activeRole, MediaAssetType.avatar, file)
  }

  @Post('courses/:courseSlug/thumbnail')
  @Roles(UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  uploadCourseThumbnail(
    @CurrentUser() user: JwtPayload,
    @Param('courseSlug') courseSlug: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('replaceAssetId') replaceAssetId?: string,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.mediaService.upload(user.sub, user.activeRole, MediaAssetType.course_thumbnail, file, {
      courseSlug,
      replaceAssetId,
    })
  }

  @Post('courses/:courseSlug/banner')
  @Roles(UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  uploadCourseBanner(
    @CurrentUser() user: JwtPayload,
    @Param('courseSlug') courseSlug: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('replaceAssetId') replaceAssetId?: string,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.mediaService.upload(user.sub, user.activeRole, MediaAssetType.course_banner, file, {
      courseSlug,
      replaceAssetId,
    })
  }

  @Post('batches/:batchId/thumbnail')
  @Roles(UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  uploadBatchThumbnail(
    @CurrentUser() user: JwtPayload,
    @Param('batchId') batchId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('replaceAssetId') replaceAssetId?: string,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.mediaService.upload(user.sub, user.activeRole, MediaAssetType.batch_thumbnail, file, {
      batchId,
      replaceAssetId,
    })
  }

  @Post('lessons/:lessonId/resources')
  @Roles(UserRole.instructor)
  @Throttle({ default: ThrottleLimits.upload })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  uploadLessonResource(
    @CurrentUser() user: JwtPayload,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.mediaService.upload(user.sub, user.activeRole, MediaAssetType.lesson_resource, file, {
      lessonId,
    })
  }

  @Post('cleanup/orphans')
  @Roles(UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  @ApiOperation({ summary: 'Permanently remove soft-deleted assets older than 7 days' })
  cleanup(@CurrentUser() user: JwtPayload) {
    return this.mediaService.cleanupOrphans(user.sub, user.activeRole)
  }

  @Get(':id/url')
  @Roles(UserRole.student, UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  signedUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: SignedUrlQueryDto,
  ) {
    const expiresIn = query.expiresIn ? Number(query.expiresIn) : undefined
    return this.mediaService.getSignedUrl(user.sub, user.activeRole, id, expiresIn)
  }

  @Get(':id/download')
  @Roles(UserRole.student, UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { stream, filename, mimeType } = await this.mediaService.openDownloadStream(
      user.sub,
      user.activeRole,
      id,
    )
    const safeFilename = sanitizeContentDispositionFilename(filename)
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`)
    await pipeStreamToResponse(stream, res)
  }

  @Delete(':id')
  @Roles(UserRole.student, UserRole.instructor, UserRole.org_admin, UserRole.platform_admin)
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mediaService.softDelete(user.sub, user.activeRole, id)
  }
}
