import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';

export class ApproveClubJoinPayload {
  @IsInt()
  @ApiProperty({
    description: '참가 신청 ID',
    type: Number,
  })
  userId!: number;

  @IsBoolean()
  @ApiProperty({
    description: '참가 여부 결정',
    type: Boolean,
  })
  approve!: boolean;
}
