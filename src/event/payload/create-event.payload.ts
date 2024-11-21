import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventPayload {
  @IsString()
  @ApiProperty({
    description: '모임 이름',
    type: String,
  })
  title!: string;

  @IsInt({ each: true })
  @ApiProperty({
    description: '도시 ID들',
    type: [Number],
  })
  cityIds!: number[];

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description: '클럽 ID',
    type: Number,
    nullable: true,
  })
  clubId?: number | null;

  @IsString()
  @ApiProperty({
    description: '모임 설명',
    type: String,
  })
  description!: string;

  @IsInt()
  @ApiProperty({
    description: '카테고리 ID',
    type: Number,
  })
  categoryId!: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: '시작 시간',
    type: Date,
  })
  startTime!: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: '종료 시간',
    type: Date,
  })
  endTime!: Date;

  @IsInt()
  @Min(1)
  @ApiProperty({
    description: '최대 인원',
    type: Number,
  })
  maxPeople!: number;
}
