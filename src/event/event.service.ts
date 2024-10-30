import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { CreateEventPayload } from './payload/create-event.payload';
import { EventDto, EventListDto } from './dto/event.dto';
import { CreateEventData } from './type/create-event-data.type';
import { EventQuery } from './query/event.query';
import { EventParticipantPayload } from './payload/create-eventJoin.payload';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(payload: CreateEventPayload): Promise<EventDto> {
    const user = await this.eventRepository.getUserById(payload.hostId);
    if (!user) {
      throw new NotFoundException('host가 존재하지 않습니다.');
    }

    const category = await this.eventRepository.getCategoryById(
      payload.categoryId,
    );
    if (!category) {
      throw new NotFoundException('category가 존재하지 않습니다.');
    }

    const city = await this.eventRepository.getCityById(payload.cityId);
    if (!city) {
      throw new NotFoundException('city가 존재하지 않습니다.');
    }

    if (payload.startTime < new Date()) {
      throw new ConflictException(
        '시작 시간이 현재 시간보다 빠를 수 없습니다.',
      );
    }

    if (payload.startTime > payload.endTime) {
      throw new ConflictException(
        '시작 시간이 끝나는 시간보다 늦을 수 없습니다.',
      );
    }

    const createData: CreateEventData = {
      hostId: payload.hostId,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityId: payload.cityId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const event = await this.eventRepository.createEvent(createData);

    return EventDto.from(event);
  }

  async getEventByEventId(eventId: number): Promise<EventDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('event가 존재하지 않습니다.');
    }

    return EventDto.from(event);
  }

  async getEvents(query: EventQuery): Promise<EventListDto> {
    const events = await this.eventRepository.getEvents(query);
    return EventListDto.from(events);
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
    const isUserJoinedEvent = await this.eventRepository.isUserJoinedEvent(
      userId,
      eventId,
    );
    if (isUserJoinedEvent) {
      throw new ConflictException('해당 유저가 이미 참가한 이벤트입니다.');
    }

    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.endTime < new Date()) {
      throw new ConflictException('이미 시작된 이벤트는 참가할 수 없습니다.');
    }

    const currentPeople = await this.eventRepository.getEventJoinCount(eventId);

    if (event.maxPeople == currentPeople) {
      throw new ConflictException('이미 정원이 다 찼습니다.');
    }

    await this.eventRepository.joinEvent(eventId, userId);
  }

  async outEvent(eventId: number, userId: number): Promise<void> {
    const isUserJoinedEvent = await this.eventRepository.isUserJoinedEvent(
      userId,
      eventId,
    );
    if (!isUserJoinedEvent) {
      throw new ConflictException('해당 유저가 참가하지 않은 이벤트입니다.');
    }

    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.hostId === userId) {
      throw new ConflictException('host는 이벤트에서 나갈 수 없습니다.');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException('이미 시작된 이벤트는 나갈 수 없습니다.');
    }

    await this.eventRepository.outEvent(eventId, userId);
  }
}
