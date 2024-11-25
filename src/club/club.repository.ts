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
    events: EventData[],
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.eventJoin.deleteMany({
      where: {
        eventId: {
          in: events.map((event) => event.id),
        },
        userId: userId,
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
  async getShouldDeletedEvents(userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        eventJoin: {
          some: {
            userId: userId,
          },
        },
        hostId: userId,
        startTime: {
          lt: new Date(),
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

  async getShouldOutEvents(userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        eventJoin: {
          some: {
            userId: userId,
          },
        },
        hostId: {
          not: userId,
        },
        startTime: {
          lt: new Date(),
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
    events: EventData[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.eventJoin.deleteMany({
      where: {
        eventId: {
          in: events.map((event) => event.id),
        },
      },
    });
    await tx.eventCity.deleteMany({
      where: {
        eventId: {
          in: events.map((event) => event.id),
        },
      },
    });
    await tx.event.deleteMany({
      where: {
        id: {
          in: events.map((event) => event.id),
        },
      },
    });
  }
  async outClub(clubId: number, userId: number): Promise<void> {
    const outevents = await this.getShouldOutEvents(userId);
    const deletedEvents = await this.getShouldDeletedEvents(userId);
    await this.prisma.$transaction(async (tx) => {
      await this.outEvent(outevents, userId, tx);

      await this.deleteEvent(deletedEvents, tx);

      await this.prisma.clubJoin.delete({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      });
    });
  }

  // orm transaction 사용 참고
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
