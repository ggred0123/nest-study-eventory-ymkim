import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventData } from '../type/event-data.type';
import { IsNotEmpty, IsOptional,IsEnum } from 'class-validator';
import { ReviewDto } from 'src/review/dto/review.dto';
import { EventJoin } from '@prisma/client';
import { EventStatus } from '../enum/event-status-enum.type';

export class JoinedUserDto {
  @ApiProperty({
    description: '유저 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '유저 이름',
    type: String,
  })
  name!: string;
}


export class EventDto {
  @ApiProperty({
    description: '호스트 ID',
    type: Number,
  })
  hostId!: number;

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

  @ApiProperty({
    description: '참가한 유저들',
    type: [JoinedUserDto],
  })
  joinedUsers!:JoinedUserDto[];

  @ApiProperty({
    description:'이벤트 상태',
  })
  @IsNotEmpty()
  @IsEnum(Object.values(EventStatus))
  status!:EventStatus;
  //type으로 했더니 오류나서 이넘 처리하는거 스텍오버플로우에서 이렇게 하라구..


  @ApiProperty({
    description: '리뷰들',
    type:[ReviewDto],
  })
  reviews!:ReviewDto[];




  static from(event: EventData): EventDto {
    return {
      hostId: event.hostId,
      id: event.id,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      startTime: event.startTime,
      endTime: event.endTime,
      maxPeople: event.maxPeople,
      cityIds: event.eventCity.map((city) => city.cityId),
      joinedUsers:event.eventJoin.map
      ((eventJoin) => {return {id: eventJoin.user.id, name: eventJoin.user.name }}    
    ),
      reviews: ReviewDto.fromArray(event.review),

      status: new Date() > event.endTime ? 
      EventStatus.COMPLETED : new Date > event.startTime ? 
      EventStatus.ONGOING : EventStatus.PENDING,

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
