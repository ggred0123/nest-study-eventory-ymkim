import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ApproveClubJoinPayload {
  @IsBoolean()
  @ApiProperty({
    description: '참가 여부 결정',
    type: Boolean,
  })
  approve!: boolean;
}
