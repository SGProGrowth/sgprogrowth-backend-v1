import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { CourseStatus, CourseVisibility, LessonType } from '@prisma/client'
import { Type } from 'class-transformer'
import { PaginationQueryDto } from './pagination.dto'
import { ToBoolean } from '../transformers/to-boolean.transform'

export class CourseCatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search title, subtitle, description' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: 'Instructor user UUID' })
  @IsOptional()
  @IsUUID()
  instructorId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string

  @ApiPropertyOptional({ enum: ['relevance', 'rating', 'newest', 'title', 'duration'] })
  @IsOptional()
  @IsString()
  sort?: 'relevance' | 'rating' | 'newest' | 'title' | 'duration'

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  featured?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  trending?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  forTeams?: boolean
}

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsOptional()
  @IsString()
  categorySlug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number

  @ApiPropertyOptional({ enum: CourseVisibility })
  @IsOptional()
  @IsEnum(CourseVisibility)
  visibility?: CourseVisibility

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  coachingIncluded?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningOutcomes?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[]
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorySlug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number

  @ApiPropertyOptional({ enum: CourseVisibility })
  @IsOptional()
  @IsEnum(CourseVisibility)
  visibility?: CourseVisibility

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  coachingIncluded?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningOutcomes?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trending?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isNew?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  forTeams?: boolean
}

export class LessonInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: LessonType })
  @IsEnum(LessonType)
  type!: LessonType

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number
}

export class ModuleInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number

  @ApiProperty({ type: [LessonInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonInputDto)
  lessons!: LessonInputDto[]
}

export class UpdateCurriculumDto {
  @ApiProperty({ type: [ModuleInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleInputDto)
  modules!: ModuleInputDto[]
}

export class ReorderCurriculumDto {
  @ApiProperty({ type: [String], description: 'Ordered module IDs' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  moduleOrder!: string[]

  @ApiProperty({
    description: 'Map of moduleId → ordered lesson IDs',
    example: { 'module-uuid': ['lesson-uuid-1', 'lesson-uuid-2'] },
  })
  @IsOptional()
  lessonOrder?: Record<string, string[]>
}

export class EnrollCourseDto {
  @ApiProperty({ description: 'Course slug' })
  @IsString()
  courseSlug!: string

  @ApiPropertyOptional({ description: 'Optional batch UUID' })
  @IsOptional()
  @IsUUID()
  batchId?: string
}

export class InstructorCoursesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus
}
