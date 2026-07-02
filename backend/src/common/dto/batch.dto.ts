import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { BatchEnrollmentStatus, BatchInstructorRole, BatchVisibility } from '@prisma/client'

export class CreateBatchDto {
  @IsString()
  name!: string

  @IsString()
  courseSlug!: string

  @IsOptional()
  @IsString()
  batchCode?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsDateString()
  startDate!: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  schedule?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxCapacity?: number

  @IsOptional()
  @IsEnum(BatchVisibility)
  visibility?: BatchVisibility

  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @IsOptional()
  @IsString()
  bannerUrl?: string

  @IsOptional()
  @IsBoolean()
  publish?: boolean
}

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  schedule?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxCapacity?: number

  @IsOptional()
  @IsEnum(BatchVisibility)
  visibility?: BatchVisibility

  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @IsOptional()
  @IsString()
  bannerUrl?: string
}

export class AddBatchStudentDto {
  @IsOptional()
  @IsUUID()
  studentId?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(BatchEnrollmentStatus)
  status?: BatchEnrollmentStatus

  @IsOptional()
  @IsBoolean()
  createAccount?: boolean
}

export class TransferBatchStudentDto {
  @IsUUID()
  targetBatchId!: string
}

export class AssignBatchInstructorDto {
  @IsUUID()
  instructorId!: string

  @IsOptional()
  @IsEnum(BatchInstructorRole)
  role?: BatchInstructorRole

  @IsOptional()
  permissions?: Record<string, boolean>
}

export class CreateBatchEventDto {
  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  type!: string

  @IsDateString()
  startsAt!: string

  @IsOptional()
  @IsDateString()
  endsAt?: string
}

export class BatchImportPreviewDto {
  @IsOptional()
  @IsUUID()
  defaultBatchId?: string

  @IsOptional()
  @IsString()
  defaultCourseSlug?: string

  @IsOptional()
  columnMapping?: Record<string, string>
}

export class BatchImportExecuteDto {
  @IsUUID()
  jobId!: string

  @IsOptional()
  @IsBoolean()
  partialImport?: boolean

  @IsOptional()
  @IsArray()
  rowNumbers?: number[]
}

export class BatchesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseSlug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string
}
