import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { QuestionDifficulty, QuestionStatus, QuestionType } from '@prisma/client'
import { Type } from 'class-transformer'
import { PaginationQueryDto } from './pagination.dto'

export class QuestionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType

  @ApiPropertyOptional({ description: 'Course slug' })
  @IsOptional()
  @IsString()
  course?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string

  @ApiPropertyOptional({ enum: QuestionStatus })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'marks', 'difficulty', 'title'] })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest' | 'marks' | 'difficulty' | 'title'
}

export class QuestionOptionInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  text!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matchKey?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matchValue?: string
}

export class CreateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string

  @ApiProperty()
  @IsString()
  @MinLength(3)
  questionText!: string

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  marks?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarks?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedSeconds?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string

  @ApiPropertyOptional({ description: 'Course slug' })
  @IsOptional()
  @IsString()
  courseSlug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lessonId?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codeSnippet?: string

  @ApiPropertyOptional({ type: [QuestionOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionInputDto)
  options?: QuestionOptionInputDto[]

  @ApiPropertyOptional()
  @IsOptional()
  correctAnswer?: Record<string, unknown>
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  questionText?: string

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  marks?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarks?: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedSeconds?: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseSlug?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lessonId?: string | null

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codeSnippet?: string | null

  @ApiPropertyOptional({ type: [QuestionOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionInputDto)
  options?: QuestionOptionInputDto[]

  @ApiPropertyOptional()
  @IsOptional()
  correctAnswer?: Record<string, unknown>
}

export class CreateQuestionCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string
}

export class ImportReportDto {
  @ApiProperty()
  imported!: number

  @ApiProperty()
  failed!: number

  @ApiProperty({ type: [Object] })
  errors!: Array<{ row: number; message: string }>
}
