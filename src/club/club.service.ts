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
    const userWaiting = await this.clubRepository.isUserWaitingClub(
      user.id,
      clubId,
    );
    if (userWaiting) {
      throw new ConflictException('해당 유저가 이미 참가 신청한 클럽입니다.');
    }
    const isUserRejected = await this.clubRepository.isUserAlreadyRejected(
      user.id,
      clubId,
    );
    if (isUserRejected) {
      throw new ConflictException('거절된 클럽에 다시 참가할 수 없습니다.');
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
