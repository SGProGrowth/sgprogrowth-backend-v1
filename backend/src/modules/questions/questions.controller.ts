import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import type { Response } from 'express'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import {
  CreateQuestionCategoryDto,
  CreateQuestionDto,
  QuestionsQueryDto,
  UpdateQuestionDto,
} from '../../common/dto/question.dto'
import { ApiMessageDto } from '../../common/dto/auth.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { QuestionsImportExportService } from './questions-import-export.service'
import { QuestionsService } from './questions.service'

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.instructor)
@Controller('questions')
export class QuestionsController {
  constructor(
    private questionsService: QuestionsService,
    private importExport: QuestionsImportExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List question bank items with search and filters' })
  list(@CurrentUser() user: JwtPayload, @Query() query: QuestionsQueryDto) {
    return this.questionsService.list(user.sub, query)
  }

  @Get('categories/list')
  @ApiOperation({ summary: 'List question categories' })
  categories(@CurrentUser() user: JwtPayload) {
    return this.questionsService.listCategories(user.sub)
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a question category' })
  createCategory(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuestionCategoryDto) {
    return this.questionsService.createCategory(user.sub, dto)
  }

  @Get('tags/list')
  @ApiOperation({ summary: 'List question tags' })
  tags(@CurrentUser() user: JwtPayload) {
    return this.questionsService.listTags(user.sub)
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export questions as CSV' })
  async exportCsv(@CurrentUser() user: JwtPayload, @Query() query: QuestionsQueryDto, @Res() res: Response) {
    const csv = await this.importExport.exportCsv(user.sub, query)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"')
    res.send(csv)
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export questions as Excel' })
  async exportExcel(@CurrentUser() user: JwtPayload, @Query() query: QuestionsQueryDto, @Res() res: Response) {
    const buffer = await this.importExport.exportExcel(user.sub, query)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="questions.xlsx"')
    res.send(buffer)
  }

  @Post('import/csv')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import questions from CSV' })
  importCsv(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required')
    return this.importExport.importCsv(user.sub, file, user.email, user.email)
  }

  @Post('import/excel')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import questions from Excel' })
  importExcel(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required')
    return this.importExport.importExcel(user.sub, file, user.email, user.email)
  }

  @Post()
  @ApiOperation({ summary: 'Create a question' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuestionDto) {
    return this.questionsService.create(user.sub, dto)
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview question rendering' })
  preview(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.preview(id, user.sub)
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List question version history' })
  versions(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.listVersions(id, user.sub)
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get a specific question version snapshot' })
  version(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.questionsService.getVersion(id, version, user.sub)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question detail' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.getOne(id, user.sub)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update question (creates new version)' })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, user.sub, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete question (only if unused in quizzes)' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<ApiMessageDto> {
    return this.questionsService.delete(id, user.sub)
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive question' })
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.archive(id, user.sub)
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore archived question' })
  restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.restore(id, user.sub)
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate question' })
  duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.questionsService.duplicate(id, user.sub)
  }

  @Post(':id/attachments')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload question attachment' })
  uploadAttachment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required')
    return this.questionsService.addAttachment(id, user.sub, file)
  }
}
