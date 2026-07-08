import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'

export class IssueCertificateDto {
  @IsOptional()
  @IsUUID()
  enrollmentId?: string

  @IsOptional()
  @IsString()
  courseSlug?: string

  @IsOptional()
  @IsUUID()
  studentId?: string

  @IsOptional()
  @IsUUID()
  templateId?: string

  @IsOptional()
  @IsString()
  expiresAt?: string

  @IsOptional()
  @IsBoolean()
  bypassRules?: boolean
}

export class RevokeCertificateDto {
  @IsString()
  reason!: string
}

export class ReissueCertificateDto {
  @IsOptional()
  @IsUUID()
  templateId?: string

  @IsOptional()
  @IsString()
  expiresAt?: string
}

export class UpdateCertificateRulesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  requireProgressPct?: number

  @IsOptional()
  @IsBoolean()
  requireAllLessons?: boolean

  @IsOptional()
  @IsBoolean()
  requireAssignmentsSubmitted?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minAssignmentScorePct?: number

  @IsOptional()
  @IsBoolean()
  requireQuizPass?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minQuizPassPct?: number

  @IsOptional()
  @IsBoolean()
  requireLiveSessions?: boolean
}

export class InstructorCertificatesQueryDto {
  @IsOptional()
  @IsString()
  courseSlug?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  status?: string
}

export class CreateCertificateTemplateDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  design?: Record<string, unknown>
}

export class UpdateCertificateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  design?: Record<string, unknown>

  @IsOptional()
  @IsString({ each: true })
  courseSlugs?: string[]
}
