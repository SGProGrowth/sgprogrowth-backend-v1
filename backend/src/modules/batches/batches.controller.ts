import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@prisma/client'
import type { Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import { validateCsvImportFile } from '../../common/import-file.validation'
import { ThrottleLimits } from '../../config/throttle.constants'
import {
  AddBatchStudentDto,
  AssignBatchInstructorDto,
  BatchImportExecuteDto,
  BatchImportPreviewDto,
  BatchesQueryDto,
  CreateBatchDto,
  CreateBatchEventDto,
  TransferBatchStudentDto,
  UpdateBatchDto,
} from '../../common/dto/batch.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { multerMemoryOptions } from '../../common/multer-options'
import { BatchImportService } from './batch-import.service'
import { BatchesService } from './batches.service'

@ApiTags('batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(
    private batchesService: BatchesService,
    private batchImportService: BatchImportService,
  ) {}

  @Get('mine')
  @Roles(UserRole.instructor)
  listInstructor(@CurrentUser() user: JwtPayload, @Query() query: BatchesQueryDto) {
    return this.batchesService.listInstructorBatches(user.sub, query)
  }

  @Get('me')
  @Roles(UserRole.student)
  listStudent(@CurrentUser() user: JwtPayload) {
    return this.batchesService.listStudentBatches(user.sub)
  }

  @Get('import/template')
  @Roles(UserRole.instructor)
  downloadTemplate(@Res() res: Response) {
    const csv = this.batchImportService.getTemplateCsv()
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="batch-import-template.csv"')
    res.send(csv)
  }

  @Post('import/preview')
  @Roles(UserRole.instructor)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
  @Throttle({ default: ThrottleLimits.upload })
  previewImport(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: BatchImportPreviewDto,
  ) {
    if (!file) throw new BadRequestException('file required')
    validateCsvImportFile(file)
    return this.batchImportService.previewImport(user.sub, file, dto)
  }

  @Post('import/execute')
  @Roles(UserRole.instructor)
  executeImport(@CurrentUser() user: JwtPayload, @Body() dto: BatchImportExecuteDto) {
    return this.batchImportService.executeImport(user.sub, dto)
  }

  @Get('import/jobs/:jobId')
  @Roles(UserRole.instructor)
  getImportJob(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
    return this.batchImportService.getImportJob(user.sub, jobId)
  }

  @Post()
  @Roles(UserRole.instructor)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBatchDto) {
    return this.batchesService.createBatch(user.sub, dto)
  }

  @Get(':id')
  @Roles(UserRole.instructor, UserRole.student)
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (user.activeRole === UserRole.student) {
      return this.batchesService.listStudentBatches(user.sub).then((b) => {
        const found = b.find((x) => x.id === id)
        if (!found) throw new NotFoundException('Batch not found')
        return found
      })
    }
    return this.batchesService.getBatchDetail(user.sub, id)
  }

  @Patch(':id')
  @Roles(UserRole.instructor)
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateBatchDto) {
    return this.batchesService.updateBatch(user.sub, id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.instructor)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.batchesService.deleteBatch(user.sub, id)
  }

  @Post(':id/archive')
  @Roles(UserRole.instructor)
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.batchesService.archiveBatch(user.sub, id)
  }

  @Post(':id/publish')
  @Roles(UserRole.instructor)
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.batchesService.publishBatch(user.sub, id)
  }

  @Post(':id/unpublish')
  @Roles(UserRole.instructor)
  unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.batchesService.unpublishBatch(user.sub, id)
  }

  @Get(':id/dashboard')
  @Roles(UserRole.instructor)
  dashboard(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.batchesService.getBatchDashboard(user.sub, id)
  }

  @Get(':id/calendar')
  @Roles(UserRole.instructor, UserRole.student)
  calendar(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (user.activeRole === UserRole.student) {
      return this.batchesService.getStudentBatchCalendar(user.sub, id)
    }
    return this.batchesService.getBatchCalendar(user.sub, id)
  }

  @Post(':id/events')
  @Roles(UserRole.instructor)
  createEvent(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBatchEventDto,
  ) {
    return this.batchesService.createBatchEvent(user.sub, id, dto)
  }

  @Get(':id/students')
  @Roles(UserRole.instructor)
  listStudents(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.batchesService.listBatchStudents(user.sub, id)
  }

  @Post(':id/students')
  @Roles(UserRole.instructor)
  addStudent(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddBatchStudentDto,
  ) {
    return this.batchesService.addStudentToBatch(user.sub, id, dto)
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.instructor)
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.batchesService.removeStudentFromBatch(user.sub, id, studentId)
  }

  @Post(':id/students/:studentId/transfer')
  @Roles(UserRole.instructor)
  transferStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: TransferBatchStudentDto,
  ) {
    return this.batchesService.transferStudent(user.sub, id, studentId, dto)
  }

  @Post(':id/instructors')
  @Roles(UserRole.instructor)
  assignInstructor(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignBatchInstructorDto,
  ) {
    return this.batchesService.assignInstructor(user.sub, id, dto)
  }
}
