import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubEventData } from '../type/club-event-data.type';
import { IsOptional } from 'class-validator';

export class ClubEventDto {
  @ApiProperty({
    description: '호스트 ID',
    type: Number,
  })
  hostId!: number;

  @ApiProperty({
    description: '클럽 ID',
    type: Number,
  })
  clubId!: number;

  @ApiProperty({
    description: '모임 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '모임 이름',
    type: String,
  })
  title!: string;

  @ApiProperty({
    description: '도시 ID들',
    type: [Number],
  })
  cityIds!: number[];

  @ApiProperty({
    description: '모임 설명',
    type: String,
  })
  description!: string;

  @ApiProperty({
    description: '카테고리 ID',
    type: Number,
  })
  categoryId!: number;

  @ApiProperty({
    description: '시작 시간',
    type: Date,
  })
  startTime!: Date;

  @ApiProperty({
    description: '종료 시간',
    type: Date,
  })
  endTime!: Date;

  @ApiProperty({
    description: '최대 인원',
    type: Number,
  })
  maxPeople!: number;

  static from(event: ClubEventData): ClubEventDto {
    return {
      hostId: event.hostId,
      id: event.id,
      clubId: event.club.id,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      startTime: event.startTime,
      endTime: event.endTime,
      maxPeople: event.maxPeople,
      cityIds: event.eventCity.map((city) => city.cityId),
    };
  }

  static fromArray(events: ClubEventData[]): ClubEventDto[] {
    return events.map((event) => this.from(event));
  }
}

export class ClubEventListDto {
  @ApiProperty({
    description: '모임 목록',
    type: [ClubEventDto],
  })
  events!: ClubEventDto[];

  static from(events: ClubEventData[]): ClubEventListDto {
    return {
      events: ClubEventDto.fromArray(events),
    };
  }
}
