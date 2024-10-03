import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CategoryListDto } from './dto/category.dto';
import { CategoryData } from './type/category-data.type';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAllCategories(): Promise<CategoryListDto> {
    const categories: CategoryData[] = await this.categoryRepository.findAllCategories();

    return CategoryListDto.from(categories);
  }
}