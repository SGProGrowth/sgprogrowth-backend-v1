import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { AssignmentStatus, AssignmentVisibility, SubmissionStatus } from '@prisma/client'
import { PaginationQueryDto } from './pagination.dto'

export class InstructorAssignmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ description: 'Course slug filter' })
  @IsOptional()
  @IsString()
  course?: string

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus
}

export class SubmissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus
}

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title!: string

  @ApiProperty({ description: 'Course slug' })
  @IsString()
  courseSlug!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lessonId?: string

  @ApiPropertyOptional({ default: 'project' })
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional({ description: 'Rich text / HTML instructions' })
  @IsOptional()
  @IsString()
  instructions?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dueAt?: string

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxScore?: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowLate?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  latePenaltyPct?: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowResubmission?: boolean

  @ApiPropertyOptional({ type: [String], example: ['pdf', 'docx', 'png'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[]

  @ApiPropertyOptional({ default: 10485760, description: 'Max file size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(1024)
  maxFileSizeBytes?: number

  @ApiPropertyOptional({ enum: AssignmentVisibility })
  @IsOptional()
  @IsEnum(AssignmentVisibility)
  visibility?: AssignmentVisibility
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lessonId?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dueAt?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxScore?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowLate?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  latePenaltyPct?: number | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowResubmission?: boolean

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1024)
  maxFileSizeBytes?: number

  @ApiPropertyOptional({ enum: AssignmentVisibility })
  @IsOptional()
  @IsEnum(AssignmentVisibility)
  visibility?: AssignmentVisibility
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  body?: string
}

export class GradeSubmissionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  score!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  feedback?: string

  @ApiPropertyOptional({ description: 'Return to student for revision instead of final grade' })
  @IsOptional()
  @IsBoolean()
  returnToStudent?: boolean
}

export class ReturnSubmissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  feedback?: string
}

export class FileAttachmentDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  filename!: string

  @ApiProperty()
  mimeType!: string

  @ApiProperty()
  sizeBytes!: number

  @ApiPropertyOptional()
  downloadUrl?: string
}

export class AssignmentListItemDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  title!: string

  @ApiProperty()
  courseId!: string

  @ApiProperty()
  courseTitle!: string

  @ApiProperty()
  dueDate!: string

  @ApiProperty()
  type!: string

  @ApiProperty()
  status!: string

  @ApiProperty()
  maxScore!: number

  @ApiProperty()
  allowLate!: boolean

  @ApiPropertyOptional()
  submissions?: number

  @ApiPropertyOptional()
  totalStudents?: number

  @ApiPropertyOptional()
  submissionStatus?: string

  @ApiPropertyOptional()
  score?: number

  @ApiPropertyOptional()
  dueLabel?: string

  @ApiPropertyOptional()
  isOverdue?: boolean

  @ApiPropertyOptional()
  dueSoon?: boolean
}

export class AssignmentDetailDto extends AssignmentListItemDto {
  @ApiPropertyOptional()
  instructions?: string

  @ApiPropertyOptional()
  moduleId?: string | null

  @ApiPropertyOptional()
  lessonId?: string | null

  @ApiProperty()
  allowResubmission!: boolean

  @ApiProperty({ type: [String] })
  allowedFileTypes!: string[]

  @ApiProperty()
  maxFileSizeBytes!: number

  @ApiProperty()
  visibility!: string

  @ApiPropertyOptional()
  latePenaltyPct?: number | null

  @ApiProperty({ type: [FileAttachmentDto] })
  attachments!: FileAttachmentDto[]
}

export class SubmissionDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  status!: string

  @ApiPropertyOptional()
  body?: string | null

  @ApiPropertyOptional()
  score?: number | null

  @ApiPropertyOptional()
  feedback?: string | null

  @ApiProperty()
  attemptCount!: number

  @ApiPropertyOptional()
  submittedAt?: string | null

  @ApiPropertyOptional()
  gradedAt?: string | null

  @ApiPropertyOptional()
  returnedAt?: string | null

  @ApiProperty({ type: [FileAttachmentDto] })
  files!: FileAttachmentDto[]

  @ApiPropertyOptional({ type: [FileAttachmentDto] })
  historyFiles?: FileAttachmentDto[]
}

export class InstructorSubmissionDto extends SubmissionDto {
  @ApiProperty()
  studentId!: string

  @ApiProperty()
  studentName!: string

  @ApiProperty()
  studentEmail!: string

  @ApiProperty()
  enrollmentId!: string
}

export class GradeHistoryDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  score!: number

  @ApiProperty()
  maxScore!: number

  @ApiPropertyOptional()
  feedback?: string | null

  @ApiProperty()
  returned!: boolean

  @ApiProperty()
  gradedAt!: string

  @ApiProperty()
  graderName!: string
}
