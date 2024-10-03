import { ApiProperty } from '@nestjs/swagger';
import { CategoryData } from '../type/category-data.type';

export class CategoryDto {
  @ApiProperty({
    description: '카테고리 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '카테고리 이름',
    type: String,
  })
  name!: string;

  static from(category: CategoryData): CategoryDto {
    return {
      id: category.id,
      name: category.name,
    };
  }

  static fromArray(categories: CategoryData[]): CategoryDto[] {
    return categories.map((category) => this.from(category));
  }
}

export class CategoryListDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [CategoryDto],
  })
  categories!: CategoryDto[];

  static from(categories: CategoryData[]): CategoryListDto {
    return {
      categories: CategoryDto.fromArray(categories),
    };
  }
}
