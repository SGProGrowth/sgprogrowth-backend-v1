import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

export enum ReportFormat {
  csv = 'csv',
  pdf = 'pdf',
  xlsx = 'xlsx',
}

export enum ReportType {
  student_progress = 'student-progress',
  assignments = 'assignments',
  quizzes = 'quizzes',
  batches = 'batches',
  courses = 'courses',
  certificates = 'certificates',
}

export class AnalyticsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseSlug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  batchId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  instructorId?: string
}

export class ReportQueryDto extends AnalyticsFilterDto {
  @ApiPropertyOptional({ enum: ReportFormat })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat
}
