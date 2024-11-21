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
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { UpdateClubData } from './type/update-club-data.type';
import { PatchUpdateClubPayload } from './payload/patch-update-club.payload';
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
    if (payload.leadId === null) {
      throw new BadRequestException('leadId는 null이 될 수 없습니다.');
    }

    await this.checkLeadPermissionOfClub(clubId, user.id);

    if (payload.leadId) {
      const checkUserInClub = await this.clubRepository.isUserJoinedClub(
        clubId,
        payload.leadId,
      );
      if (!checkUserInClub) {
        throw new ConflictException(
          '클럽 리드로 지정된 유저가 클럽에 가입되어 있지 않습니다.',
        );
      }
    }

    const updateData: UpdateClubData = {
      name: payload.name,
      leadId: payload.leadId,
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
