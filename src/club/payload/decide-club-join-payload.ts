import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { min } from 'lodash';
import { Type } from 'class-transformer';

export class DecideClubJoinPayload {
  @IsString()
  @ApiProperty({
    description: '참가 여부 결정',
    type: String,
  })
  decision!: string;
}
