import { apiRequest } from './client'
import type { Category } from '../../data/homepageData'

export interface CategoryDto {
  id: string
  title: string
  description: string
  courseCount: number
  icon: Category['icon']
}

export function fetchCategories() {
  return apiRequest<CategoryDto[]>('/categories')
}

export function mapCategoryToUi(dto: CategoryDto): Category {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    courseCount: dto.courseCount,
    icon: dto.icon,
  }
}
