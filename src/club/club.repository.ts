import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateClubData } from './type/create-club-data.type';
import { ClubData } from './type/club-data.type';
import {
  User,
  Club,
  ClubJoin,
  WaitingStatus,
  Prisma,
  PrismaPromise,
} from '@prisma/client';
import { EventData } from 'src/event/type/event-data.type';
import { UpdateClubData } from './type/update-club-data.type';
import { filter } from 'lodash';
import { ClubWaitingData } from './type/club-waiting-data.type';
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
  outEvent(eventsId: number[], userId: number) {
    return [
      this.prisma.eventJoin.deleteMany({
        where: {
          eventId: {
            in: eventsId,
          },
          userId: userId,
        },
      }),
    ];
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

  deleteEvent(eventsId: number[]) {
    if (eventsId.length === 0) {
      return [];
    }
    return [
      this.prisma.eventJoin.deleteMany({
        where: {
          eventId: {
            in: eventsId,
          },
        },
      }),
      this.prisma.eventCity.deleteMany({
        where: {
          eventId: {
            in: eventsId,
          },
        },
      }),
      this.prisma.event.deleteMany({
        where: {
          id: {
            in: eventsId,
          },
        },
      }),
    ];
  }

  async outClub(clubId: number, userId: number): Promise<void> {
    const myEvents = await this.getMyEvents(userId);
    const outevents = myEvents.filter(
      (event) => event.hostId !== userId && event.startTime < new Date(),
    );
    const deletedEvents = myEvents.filter(
      (event) => event.hostId === userId && event.startTime < new Date(),
    );
    const outeventsId = outevents.map((event) => event.id);
    const deletedEventsId = deletedEvents.map((event) => event.id);

    await this.prisma.$transaction([
      ...this.outEvent(outeventsId, userId),
      ...this.deleteEvent(deletedEventsId),
      this.prisma.clubJoin.delete({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      }),
    ]);
  }

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

  async getClubWaitingList(clubId: number): Promise<ClubWaitingData[]> {
    return this.prisma.clubWaiting.findMany({
      where: {
        clubId,
        status: WaitingStatus.PENDING,
        user: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        userId: true,
        clubId: true,
        status: true,
      },
    });
  }
}
