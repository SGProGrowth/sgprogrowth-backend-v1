import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MediaAssetType } from '@prisma/client'
import { IsEnum, IsNotIn, IsOptional, IsString, IsUUID } from 'class-validator'

export class MediaUploadBodyDto {
  @ApiProperty({ enum: MediaAssetType })
  @IsEnum(MediaAssetType)
  @IsNotIn([MediaAssetType.other], { message: 'assetType must be a specific media type' })
  assetType!: MediaAssetType

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
  @IsUUID()
  lessonId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  replaceAssetId?: string
}

export class MediaListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ enum: MediaAssetType })
  @IsOptional()
  @IsEnum(MediaAssetType)
  type?: MediaAssetType

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string

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
  @IsUUID()
  ownerId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageSize?: string
}

export class SignedUrlQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresIn?: string
}
