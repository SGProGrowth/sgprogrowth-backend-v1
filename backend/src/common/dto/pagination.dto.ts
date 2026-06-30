import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20
}

export class PaginatedMetaDto {
  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number
}

export function buildPaginatedMeta(total: number, page: number, pageSize: number): PaginatedMetaDto {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  }
}

export function paginationArgs(page = 1, pageSize = 20) {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(100, Math.max(1, pageSize))
  return {
    skip: (safePage - 1) * safeSize,
    take: safeSize,
    page: safePage,
    pageSize: safeSize,
  }
}
