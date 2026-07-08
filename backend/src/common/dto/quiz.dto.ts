import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
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
  Min,
  ValidateNested,
} from 'class-validator'
import { QuizQuestionSelectionMode, QuizStatus, QuizVisibility } from '@prisma/client'
import { PaginationQueryDto } from './pagination.dto'

export class InstructorQuizzesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ enum: QuizStatus })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  generic?: boolean
}

export class CreateQuizDto {
  @ApiProperty()
  @IsString()
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseSlug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGeneric?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unlimitedDuration?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passScore?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  randomizeOptions?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  negativeMarking?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showScoreImmediately?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showExplanations?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availableFrom?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availableUntil?: string

  @ApiPropertyOptional({ enum: QuizVisibility })
  @IsOptional()
  @IsEnum(QuizVisibility)
  visibility?: QuizVisibility

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lessonId?: string
}

export class UpdateQuizDto extends CreateQuizDto {}

export class QuizQuestionInputDto {
  @ApiProperty()
  @IsUUID()
  questionId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  pinnedVersion?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  pointsOverride?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class SetQuizQuestionsDto {
  @ApiProperty({ type: [QuizQuestionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionInputDto)
  questions!: QuizQuestionInputDto[]
}

export class GenerateQuizQuestionsDto {
  @ApiProperty({ enum: QuizQuestionSelectionMode })
  @IsEnum(QuizQuestionSelectionMode)
  mode!: QuizQuestionSelectionMode

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(200)
  count!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean
}

export class SaveQuizAnswersDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  answers!: Array<{
    quizQuestionId: string
    response: unknown
    flagged?: boolean
  }>
}

export class GradeQuizAnswerDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  score!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string
}

export class RegradeAttemptDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyStudent?: boolean
}
