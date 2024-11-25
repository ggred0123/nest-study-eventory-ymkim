import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateClubData } from './type/create-club-data.type';
import { ClubData } from './type/club-data.type';
import { User, Club, ClubJoin, WaitingStatus, Prisma } from '@prisma/client';
import { EventData } from 'src/event/type/event-data.type';
import { UpdateClubData } from './type/update-club-data.type';
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
  async outEvent(
    eventId: number,
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.eventJoin.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }
  async getMyEvents(userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        eventJoin: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
        club: {
          select: {
            id: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
      },
    });
  }
  async deleteEvent(
    eventId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.eventJoin.deleteMany({
      where: {
        eventId: eventId,
      },
    });
    await tx.eventCity.deleteMany({
      where: {
        eventId: eventId,
      },
    });
    await tx.event.delete({
      where: {
        id: eventId,
      },
    });
  }
  async outClub(clubId: number, userId: number): Promise<void> {
    const events = await this.getMyEvents(userId);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      for (const event of events) {
        if (event.startTime < now) {
          if (event?.hostId === userId) {
            await this.deleteEvent(event.id, tx);
          } else await this.outEvent(event.id, userId, tx);
        }
      }
      await tx.clubJoin.delete({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      });
    });
  } // orm transaction 사용 참고
  async getEventByEventId(eventId: number): Promise<EventData | null> {
    return this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
        club: {
          select: {
            id: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
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

  async isUserJoinedClub(userId: number, clubId: number): Promise<boolean> {
    const clubExist = await this.prisma.clubJoin.findUnique({
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

    return !!clubExist;
  }
  async isUserWaitingClub(userId: number, clubId: number): Promise<boolean> {
    const userPending = await this.prisma.clubWaiting.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
        status: WaitingStatus.PENDING,
        user: {
          deletedAt: null,
        },
      },
    });

    return !!userPending;
  }
  async isUserAlreadyRejected(
    userId: number,
    clubId: number,
  ): Promise<boolean> {
    const userPending = await this.prisma.clubWaiting.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
        status: WaitingStatus.PENDING,
        user: {
          deletedAt: null,
        },
      },
    });
    return !!userPending;
  }

  async joinClubWaiting(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubWaiting.create({
      data: {
        clubId,
        userId,
        status: WaitingStatus.PENDING,
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
          status: WaitingStatus.APPROVED,
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
        status: WaitingStatus.REJECTED,
      },
    });
  }

  async getClubJoinCount(clubId: number): Promise<number> {
    return this.prisma.clubJoin.count({
      where: {
        clubId,
        user: {
          deletedAt: null,
        },
      },
    });
  }

  async updateClub(clubId: number, data: UpdateClubData): Promise<ClubData> {
    return this.prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        name: data.name,
        leadId: data.leadId,
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
}
