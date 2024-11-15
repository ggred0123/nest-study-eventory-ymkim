import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClubRepository } from './club.repository';
import { CreateClubPayload } from './payload/create-club.payload';
import { ClubDto, ClubListDto } from './dto/club.dto';
import { CreateClubData } from './type/create-club-data.type';
import { ClubQuery } from './query/club.query';
import { UpdateClubData } from './type/update-club-data.type';
import { PatchUpdateClubPayload } from './payload/patch-update-club.payload';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CreateEventPayload } from 'src/event/payload/create-event.payload';
import { ClubEventDto } from './dto/club-event.dto';
import { CreateClubEventData } from './type/create-club-event-data.type';
import { EventRepository } from 'src/event/event.repository';
@Injectable()
export class ClubService {
  constructor(private readonly clubRepository: ClubRepository) {}

  async createClub(
    payload: CreateClubPayload,
    user: UserBaseInfo,
  ): Promise<ClubDto> {
    const createData: CreateClubData = {
      leadId: user.id,
      name: payload.name,
      description: payload.description,
      maxPeople: payload.maxPeople,
    };

    const club = await this.clubRepository.createClub(createData);

    return ClubDto.from(club);
  }

  async getClubByClubId(clubId: number): Promise<ClubDto> {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('club이 존재하지 않습니다.');
    }

    return ClubDto.from(club);
  }

  /*async getClubs(query: ClubQuery): Promise<ClubListDto> {
    const clubs = await this.clubRepository.getClubs(query);

    return ClubListDto.from(clubs);
  }*/

  async joinClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const isUserJoinedClub = await this.clubRepository.isUserJoinedClub(
      user.id,
      clubId,
    );

    if (isUserJoinedClub) {
      throw new ConflictException('해당 유저가 이미 참가한 클럽입니다.');
    }

    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }

    await this.clubRepository.joinClubWaiting(clubId, user.id);
  }

  async outClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const isUserJoinedClub = await this.clubRepository.isUserJoinedClub(
      user.id,
      clubId,
    );

    if (!isUserJoinedClub) {
      throw new ConflictException('해당 유저가 참가하지 않은 클럽입니다.');
    }

    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }

    if (club.leadId === user.id) {
      throw new ConflictException('lead는 클럽에서 나갈 수 없습니다.');
    }

    const events = await this.clubRepository.getMyEvents(user.id);
    for (let i = 0; i < events.length; i++) {
      if (events[i].club && events[i].club?.id === clubId) {
        await this.outOrDeleteEvent(events[i].id, user.id);
      }
    }

    await this.clubRepository.outClub(clubId, user.id);
  }

  async outOrDeleteEvent(eventId: number, userId: number): Promise<void> {
    const event = await this.clubRepository.getEventByEventId(eventId);
    if (event?.hostId === userId) {
      await this.clubRepository.deleteEvent(eventId);
    } else await this.clubRepository.outEvent(eventId, userId);
  }

  async approveClubJoin(
    clubId: number,
    userId: number,
    approve: boolean,
    user: UserBaseInfo,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }

    const IsUserWaitingClub = await this.clubRepository.isUserWaitingClub(
      clubId,
      userId,
    );
    if (!IsUserWaitingClub) {
      throw new ConflictException('해당 유저가 대기중인 클럽이 아닙니다.');
    }

    await this.checkLeadPermissionOfClub(clubId, user.id);

    if (!approve) {
      await this.clubRepository.rejectClubJoin(clubId, userId);
    } else {
      await this.clubRepository.approveClubJoin(clubId, userId);
    }
  }

  async patchUpdateClub(
    clubId: number,
    payload: PatchUpdateClubPayload,
    user: UserBaseInfo,
  ): Promise<ClubDto> {
    if (payload.name === null) {
      throw new BadRequestException('title은 null이 될 수 없습니다.');
    }
    if (payload.description === null) {
      throw new BadRequestException('description은 null이 될 수 없습니다.');
    }
    if (payload.maxPeople === null) {
      throw new BadRequestException('maxPeople은 null이 될 수 없습니다.');
    }

    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }
    if (club.leadId !== user.id) {
      throw new ForbiddenException('리드가 아닙니다!');
    }

    const updateData: UpdateClubData = {
      name: payload.name,
      leadId: user.id,
      description: payload.description,
      maxPeople: payload.maxPeople,
    };

    const clubJoinCount = await this.clubRepository.getClubJoinCount(clubId);

    if (payload.maxPeople && payload.maxPeople < clubJoinCount) {
      throw new ConflictException(
        '정원을 현재 참가자 수보다 작게 수정할 수 없습니다.',
      );
    }

    const updatedClub = await this.clubRepository.updateClub(
      clubId,
      updateData,
    );

    return ClubDto.from(updatedClub);
  }

  async deleteClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }
    await this.checkLeadPermissionOfClub(clubId, user.id);

    await this.clubRepository.deleteClub(clubId);

    const events = await this.clubRepository.getEventsByClubId(clubId);
    for (let i = 0; i < events.length; i++) {
      if (events[i].club && events[i].club?.id === clubId) {
        await this.clubRepository.deleteEvent(events[i].id);
      }
    }
    await this.clubRepository.deleteClub(clubId);
  }

  private async checkLeadPermissionOfClub(clubId: number, userId: number) {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('club가 존재하지 않습니다.');
    }

    if (club.leadId !== userId) {
      throw new ForbiddenException('리드가 아닙니다!');
    }
  }
}
