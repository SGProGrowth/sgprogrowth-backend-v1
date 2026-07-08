import {
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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@prisma/client'
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators/auth.decorator'
import {
  CourseCatalogQueryDto,
  CreateCourseDto,
  InstructorCoursesQueryDto,
  ReorderCurriculumDto,
  UpdateCourseDto,
  UpdateCurriculumDto,
} from '../../common/dto/course.dto'
import { ApiMessageDto } from '../../common/dto/auth.dto'
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards'
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard'
import { ThrottleLimits } from '../../config/throttle.constants'
import { CoursesCatalogService } from './courses-catalog.service'
import { CoursesCurriculumService } from './courses-curriculum.service'
import { CoursesService } from './courses.service'

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private catalogService: CoursesCatalogService,
    private coursesService: CoursesService,
    private curriculumService: CoursesCurriculumService,
  ) {}

  @Get()
  @Throttle({ default: ThrottleLimits.public })
  @ApiOperation({ summary: 'Public course catalog with search, filters, and pagination' })
  listCatalog(@Query() query: CourseCatalogQueryDto) {
    return this.catalogService.listCatalog(query)
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'List courses owned by the authenticated instructor' })
  listMine(@CurrentUser() user: JwtPayload, @Query() query: InstructorCoursesQueryDto) {
    return this.coursesService.listInstructorCourses(user.sub, query)
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Create a new draft course' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(user.sub, dto)
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: ThrottleLimits.public })
  @ApiOperation({ summary: 'Course detail — public catalog view or owner/enrolled access' })
  getOne(@Param('slug') slug: string, @CurrentUser() user: JwtPayload | null) {
    return this.coursesService.findBySlugForViewer(slug, user ?? undefined)
  }

  @Patch(':slug')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Update course metadata (owner only)' })
  update(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(slug, user.sub, dto)
  }

  @Delete(':slug')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Delete draft course (owner only)' })
  delete(@Param('slug') slug: string, @CurrentUser() user: JwtPayload): Promise<ApiMessageDto> {
    return this.coursesService.delete(slug, user.sub)
  }

  @Post(':slug/publish')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Publish course (owner only)' })
  publish(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.publish(slug, user.sub)
  }

  @Post(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Revert course to draft (owner only)' })
  unpublish(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.unpublish(slug, user.sub)
  }

  @Post(':slug/archive')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Archive course (owner only)' })
  archive(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.archive(slug, user.sub)
  }

  @Get(':slug/curriculum')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Get course curriculum (owner only)' })
  getCurriculum(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.curriculumService.getCurriculum(slug, user.sub)
  }

  @Put(':slug/curriculum')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Replace course modules and lessons (owner only)' })
  replaceCurriculum(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCurriculumDto,
  ) {
    return this.curriculumService.replaceCurriculum(slug, user.sub, dto)
  }

  @Patch(':slug/curriculum/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  @ApiOperation({ summary: 'Reorder modules and lessons (owner only)' })
  reorderCurriculum(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReorderCurriculumDto,
  ) {
    return this.curriculumService.reorder(slug, user.sub, dto)
  }
}
