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
import { ApproveClubJoinPayload } from './payload/approve-club-join.payload';

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
    payload: ApproveClubJoinPayload,
    user: UserBaseInfo,
  ): Promise<void> {
    await this.checkLeadPermissionOfClub(clubId, user.id);

    const IsUserWaitingClub = await this.clubRepository.isUserWaitingClub(
      clubId,
      payload.userId,
    );
    if (!IsUserWaitingClub) {
      throw new ConflictException('해당 유저가 대기중인 클럽이 아닙니다.');
    }

    if (payload.approve) {
      await this.clubRepository.approveClubJoin(clubId, payload.userId);
      return;
    }
    await this.clubRepository.rejectClubJoin(clubId, payload.userId);
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
