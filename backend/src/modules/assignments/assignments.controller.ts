import { pipeStreamToResponse } from '../../common/pipe-stream-to-response'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
import { UserRole } from '@prisma/client'
import type { Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { ThrottleLimits } from '../../config/throttle.constants'
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  InstructorAssignmentsQueryDto,
  ReturnSubmissionDto,
  SubmitAssignmentDto,
  SubmissionsQueryDto,
  UpdateAssignmentDto,
} from '../../common/dto/assignment.dto'
import { ApiMessageDto } from '../../common/dto/auth.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { multerMemoryOptions } from '../../common/multer-options'
import { AssignmentsService } from './assignments.service'

@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get('mine')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'List assignments owned by the instructor' })
  listMine(@CurrentUser() user: JwtPayload, @Query() query: InstructorAssignmentsQueryDto) {
    return this.assignmentsService.listInstructorAssignments(user.sub, query)
  }

  @Get('me')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'List published assignments for enrolled courses' })
  listForStudent(@CurrentUser() user: JwtPayload, @Query() query: InstructorAssignmentsQueryDto) {
    return this.assignmentsService.listStudentAssignments(user.sub, query)
  }

  @Post()
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Create a draft assignment' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.createAssignment(user.sub, dto)
  }

  @Get(':id')
  @Roles(UserRole.instructor, UserRole.student)
  @ApiOperation({ summary: 'Assignment detail (instructor owner or enrolled student)' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (user.activeRole === UserRole.instructor) {
      return this.assignmentsService.getAssignmentForInstructor(id, user.sub)
    }
    return this.assignmentsService.getAssignmentForStudent(id, user.sub)
  }

  @Patch(':id')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Update assignment metadata' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.updateAssignment(id, user.sub, dto)
  }

  @Delete(':id')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Delete draft assignment' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<ApiMessageDto> {
    return this.assignmentsService.deleteAssignment(id, user.sub)
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Publish assignment to enrolled students' })
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.publishAssignment(id, user.sub)
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Revert assignment to draft' })
  unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.unpublishAssignment(id, user.sub)
  }

  @Post(':id/attachments')
  @Roles(UserRole.instructor)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  @Throttle({ default: ThrottleLimits.upload })
  @ApiOperation({ summary: 'Upload instructor resource attachment' })
  uploadAttachment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.assignmentsService.addAssignmentAttachment(id, user.sub, file)
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Remove instructor resource attachment' })
  deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.deleteAssignmentAttachment(id, attachmentId, user.sub)
  }

  @Get(':id/attachments/:attachmentId/download')
  @Roles(UserRole.instructor, UserRole.student)
  @ApiOperation({ summary: 'Download instructor resource attachment' })
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const role = user.activeRole === UserRole.instructor ? 'instructor' : 'student'
    const file = await this.assignmentsService.downloadAssignmentAttachment(
      id,
      attachmentId,
      user.sub,
      role,
    )
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
    await pipeStreamToResponse(file.stream, res)
  }

  @Get(':id/submissions')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'List student submissions for an assignment' })
  listSubmissions(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: SubmissionsQueryDto,
  ) {
    return this.assignmentsService.listSubmissions(id, user.sub, query)
  }

  @Get(':id/submissions/:submissionId')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Get a student submission' })
  getSubmission(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.getSubmission(id, submissionId, user.sub)
  }

  @Get(':id/submissions/:submissionId/grades')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Grade history for a submission' })
  gradeHistory(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.getSubmissionGradeHistory(id, submissionId, user.sub)
  }

  @Post(':id/submissions/:submissionId/grade')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Grade or re-grade a submission' })
  grade(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(id, submissionId, user.sub, dto)
  }

  @Post(':id/submissions/:submissionId/return')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Return submission to student for revision' })
  returnSubmission(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReturnSubmissionDto,
  ) {
    return this.assignmentsService.returnSubmission(id, submissionId, user.sub, dto)
  }

  @Get(':id/submissions/:submissionId/files/:fileId/download')
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Download a student submission file (instructor)' })
  async downloadSubmissionFileInstructor(
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const file = await this.assignmentsService.downloadSubmissionFile(
      id,
      submissionId,
      fileId,
      user.sub,
      'instructor',
    )
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
    await pipeStreamToResponse(file.stream, res)
  }

  @Get(':id/submissions/mine')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Get current student submission and grade history' })
  mySubmission(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.getMySubmission(id, user.sub)
  }

  @Post(':id/submissions')
  @Roles(UserRole.student)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, multerMemoryOptions))
  @Throttle({ default: ThrottleLimits.upload })
  @ApiOperation({ summary: 'Submit assignment (first submission)' })
  submit(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitAssignmentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.assignmentsService.submitAssignment(id, user.sub, dto.body, files ?? [], false)
  }

  @Put(':id/submissions')
  @Roles(UserRole.student)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, multerMemoryOptions))
  @Throttle({ default: ThrottleLimits.upload })
  @ApiOperation({ summary: 'Replace submission (when resubmission allowed)' })
  replaceSubmission(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitAssignmentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.assignmentsService.submitAssignment(id, user.sub, dto.body, files ?? [], true)
  }

  @Get(':id/submissions/mine/files/:fileId/download')
  @Roles(UserRole.student)
  @ApiOperation({ summary: 'Download own submission file' })
  async downloadMyFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const file = await this.assignmentsService.downloadMySubmissionFile(id, fileId, user.sub)
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
    await pipeStreamToResponse(file.stream, res)
  }
}
