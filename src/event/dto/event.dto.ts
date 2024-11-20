import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventData } from '../type/event-data.type';
import { IsOptional } from 'class-validator';

export class EventDto {
  @ApiProperty({
    description: '호스트 ID',
    type: Number,
  })
  hostId!: number;

  @ApiProperty({
    description: '클럽 ID',
    type: Number,
    nullable: true,
  })
  clubId!: number | null;

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

  static from(event: EventData): EventDto {
    return {
      hostId: event.hostId,
      id: event.id,
      clubId: event.club?.id ?? null,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      startTime: event.startTime,
      endTime: event.endTime,
      maxPeople: event.maxPeople,
      cityIds: event.eventCity.map((city) => city.cityId),
    };
  }

  static fromArray(events: EventData[]): EventDto[] {
    return events.map((event) => this.from(event));
  }
}

export class EventListDto {
  @ApiProperty({
    description: '모임 목록',
    type: [EventDto],
  })
  events!: EventDto[];

  static from(events: EventData[]): EventListDto {
    return {
      events: EventDto.fromArray(events),
    };
  }
}
