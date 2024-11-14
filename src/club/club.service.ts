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

  async createClubEvent(
    clubId: number,
    payload: CreateEventPayload,
    user: UserBaseInfo,
  ): Promise<ClubEventDto> {
    const isUserJoinedClub = await this.clubRepository.isUserJoinedClub(
      user.id,
      clubId,
    );
    if (!isUserJoinedClub) {
      throw new ConflictException('해당 유저가 참가하지 않은 클럽입니다.');
    }

    const createData: CreateClubEventData = {
      hostId: user.id,
      clubId: clubId,
      title: payload.title,
      description: payload.description,
      cityIds: payload.cityIds,
      categoryId: payload.categoryId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const event = await this.clubRepository.createClubEvent(createData);

    return ClubEventDto.from(event);
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
      throw new ConflictException('해당 유저가 이미 참가한 이벤트입니다.');
    }

    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }

    const currentPeople = await this.clubRepository.getClubJoinCount(clubId);

    if (club.maxPeople == currentPeople) {
      throw new ConflictException('이미 정원이 다 찼습니다.');
    }

    await this.clubRepository.joinClubWaiting(clubId, user.id);
  }

  async outClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const isUserJoinedClub = await this.clubRepository.isUserJoinedClub(
      user.id,
      clubId,
    );

    if (!isUserJoinedClub) {
      throw new ConflictException('해당 유저가 참가하지 않은 이벤트입니다.');
    }

    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }

    if (club.leadId === user.id) {
      throw new ConflictException('host는 이벤트에서 나갈 수 없습니다.');
    }

    await this.clubRepository.outClub(clubId, user.id);
  }

  async changeClubLead(
    clubId: number,
    userId: number,
    user: UserBaseInfo,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }
    const isUserJoinedClub = await this.clubRepository.isUserJoinedClub(
      userId,
      clubId,
    );

    if (!isUserJoinedClub) {
      throw new ConflictException('해당 유저가 참가하지 않은 클럽입니다.');
    }

    await this.checkLeadPermissionOfClub(clubId, user.id);

    await this.clubRepository.changeClubLead(clubId, userId);
  }

  async decideClubJoin(
    clubId: number,
    userId: number,
    decision: string,
    user: UserBaseInfo,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Club가 존재하지 않습니다.');
    }

    const IsUserWaitingClub = await this.clubRepository.IsUserWaitingClub(
      clubId,
      userId,
    );
    if (!IsUserWaitingClub) {
      throw new ConflictException('해당 유저가 대기중인 클럽이 아닙니다.');
    }

    await this.checkLeadPermissionOfClub(clubId, user.id);

    if (decision === 'reject') {
      await this.clubRepository.rejectClubJoin(clubId, userId);
    } else if (decision === 'approve') {
      await this.clubRepository.approveClubJoin(clubId, userId);
    } else {
      throw new BadRequestException('잘못된 요청입니다.');
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

    const updateData: UpdateClubData = {
      name: payload.name,
      description: payload.description,
      maxPeople: payload.maxPeople,
    };

    await this.checkLeadPermissionOfClub(clubId, user.id);

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
  }

  private async checkLeadPermissionOfClub(clubId: number, userId: number) {
    const club = await this.clubRepository.getClubById(clubId);

    if (!club) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (club.leadId !== userId) {
      throw new ForbiddenException('호스트가 아닙니다!');
    }
  }
}
