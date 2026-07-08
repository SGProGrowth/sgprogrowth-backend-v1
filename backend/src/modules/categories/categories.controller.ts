import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { ThrottleLimits } from '../../config/throttle.constants'
import { CategoriesService } from './categories.service'

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @Throttle({ default: ThrottleLimits.public })
  @ApiOperation({ summary: 'List course categories with published course counts' })
  list() {
    return this.categoriesService.list()
  }
}
