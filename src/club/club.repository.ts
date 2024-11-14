import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateClubData } from './type/create-club-data.type';
import { ClubData } from './type/club-data.type';
import { User, Club, ClubJoin } from '@prisma/client';
import { ClubQuery } from './query/club.query';
import { UpdateClubData } from './type/update-club-data.type';
import { CreateClubEventData } from './type/create-club-event-data.type';
import { ClubEventData } from './type/club-event-data.type';
@Injectable()
export class ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClub(data: CreateClubData): Promise<ClubData> {
    return this.prisma.club.create({
      data: {
        leadId: data.leadId,
        name: data.name,
        description: data.description,
        maxPeople: data.maxPeople,
        clubJoin: {
          create: {
            userId: data.leadId,
          },
        },
      },
      select: {
        id: true,
        leadId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async getWaitingListByClubId(ClubId: number): Promise<number[]> {
    const ClubWaiting = await this.prisma.clubWaiting.findMany({
      where: {
        clubId: ClubId,
        status: 'PENDING',
      },
    });

    return ClubWaiting.map((clubWaiting) => clubWaiting.userId);
  }

  async isClubExist(id: number): Promise<boolean> {
    const Club = await this.prisma.club.findUnique({
      where: {
        id: id,
      },
    });

    return !!Club;
  }

  async isUserJoinedClub(userId: number, clubId: number): Promise<boolean> {
    const Club = await this.prisma.clubJoin.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
        user: {
          deletedAt: null,
        },
      },
    });

    return !!Club;
  }
  async joinClubWaiting(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubWaiting.create({
      data: {
        clubId,
        userId,
        status: 'PENDING',
      },
      select: {
        id: true,
        clubId: true,
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async getClubJoin(id: number): Promise<ClubJoin | null> {
    return this.prisma.clubJoin.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        clubId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getClubJoinCount(clubId: number): Promise<number> {
    return this.prisma.clubJoin.count({
      where: {
        clubId,
      },
    });
  }

  async outClub(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubJoin.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });
  }

  async getClubById(id: number): Promise<ClubData | null> {
    return this.prisma.club.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        leadId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }

  /*async getClubs(query: ClubQuery): Promise<ClubData[]> {
    return this.prisma.club.findMany({
      where: {
        leadId: query.leadId,
      },
      select: {
        id: true,
        leadId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }*/

  async updateClub(clubId: number, data: UpdateClubData): Promise<ClubData> {
    return this.prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        name: data.name,
        description: data.description,
        maxPeople: data.maxPeople,
      },
      select: {
        id: true,
        leadId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }
  async getClubWaitingList(clubId: number): Promise<number[]> {
    const clubWaiting = await this.prisma.clubWaiting.findMany({
      where: {
        clubId,
      },
    });

    return clubWaiting.map((clubWaiting) => clubWaiting.userId);
  }
  async IsUserWaitingClub(clubId: number, userId: number): Promise<boolean> {
    const clubWaiting = await this.prisma.clubWaiting.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
        status: 'PENDING',
      },
    });

    return !!clubWaiting;
  }

  async changeClubLead(clubId: number, userId: number): Promise<void> {
    await this.prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        leadId: userId,
      },
    });
  }

  async deleteClub(ClubId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.clubJoin.deleteMany({
        where: {
          clubId: ClubId,
        },
      }),
      this.prisma.clubWaiting.deleteMany({
        where: {
          clubId: ClubId,
        },
      }),
      this.prisma.club.delete({
        where: {
          id: ClubId,
        },
      }),
    ]);
  }

  async approveClubJoin(clubId: number, userId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.clubJoin.create({
        data: {
          clubId,
          userId,
        },
      }),
      this.prisma.clubWaiting.update({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
        data: {
          status: 'APPROVED',
        },
      }),
    ]);
  }

  async rejectClubJoin(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubWaiting.update({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      data: {
        status: 'REJECTED',
      },
    });
  }
}
