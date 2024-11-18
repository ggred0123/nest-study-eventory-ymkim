import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { min } from 'lodash';
import { Type } from 'class-transformer';

export class ApproveClubJoinPayload {
  @IsBoolean()
  @ApiProperty({
    description: '참가 여부 결정',
    type: Boolean,
  })
  approve!: boolean;
}
