import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubData } from '../type/club-data.type';
import { IsOptional } from 'class-validator';
import { WaitingStatus } from '@prisma/client';
import { ClubWaitingData } from 'src/club/type/club-waiting-data.type';

export class ClubWaitingDto {
  @ApiProperty({
    description: '클럽 웨이팅 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '클럽 ID',
    type: Number,
  })
  clubId!: number;

  @ApiProperty({
    description: '유저 ID',
    type: Number,
  })
  userId!: number;

  @ApiProperty({
    description: '현재 상태',
    enum: WaitingStatus,
  })
  status!: WaitingStatus;

  static from(clubWaiting: ClubWaitingData): ClubWaitingDto {
    return {
      id: clubWaiting.id,
      clubId: clubWaiting.clubId,
      userId: clubWaiting.userId,
      status: clubWaiting.status,
    };
  }

  static fromArray(ClubWaitings: ClubWaitingData[]): ClubWaitingDto[] {
    return ClubWaitings.map((ClubWaiting) => this.from(ClubWaiting));
  }
}
export class ClubWaitingListDto {
  @ApiProperty({
    description: '클럽 웨이팅 목록',
    type: [ClubWaitingDto],
  })
  ClubWaitings!: ClubWaitingDto[];

  static from(ClubWaitings: ClubWaitingData[]): ClubWaitingListDto {
    return {
      ClubWaitings: ClubWaitingDto.fromArray(ClubWaitings),
    };
  }
}
