import { IsDate, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PatchUpdateClubPayload {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '클럽 이름',
    type: String,
  })
  name?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: '클럽 설명',
    type: String,
  })
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: '최대 인원',
    type: Number,
  })
  maxPeople?: number | null;
}
