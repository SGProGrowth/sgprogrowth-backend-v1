import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'

export class UpdateLessonProgressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  videoProgressPct?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  resourceDownloaded?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  recordAccess?: boolean
}

export class RecordLiveAttendanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSeconds?: number
}
