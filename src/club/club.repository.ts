import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateClubData } from './type/create-club-data.type';
import { ClubData } from './type/club-data.type';
import { User, Club, ClubJoin, WaitingStatus } from '@prisma/client';
import { ClubQuery } from './query/club.query';
import { UpdateClubData } from './type/update-club-data.type';
import { CreateClubEventData } from './type/create-club-event-data.type';
import { ClubEventData } from './type/club-event-data.type';
import { EventData } from 'src/event/type/event-data.type';
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
        status: WaitingStatus.PENDING,
      },
    });

    return ClubWaiting.map((clubWaiting) => clubWaiting.userId);
  }
  async outEvent(eventId: number, userId: number): Promise<void> {
    await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
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

  async getEventListByUserId(userId: number): Promise<number[]> {
    const eventJoin = await this.prisma.eventJoin.findMany({
      where: {
        userId: userId,
      },
    });

    return eventJoin.map((eventJoin) => eventJoin.eventId);
  }
  async checkEventMadeInClub(
    eventId: number,
    clubId: number,
  ): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    return event?.clubId === clubId;
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
        user: {
          deletedAt: null,
        },
      },
    });
  }
  async isUserJoinedEvent(userId: number, eventId: number): Promise<boolean> {
    const event = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
        user: {
          deletedAt: null,
        },
      },
    });
    return !!event;
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
  async getEventsByClubId(clubId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        clubId: clubId,
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

  /* 일단 그 유저가 참가한 클럽 내 모임..그러니까 탈퇴 하려면 그 유저가 만약에 클럽 내 모임에 있으면 그 모임에서도 탈퇴 시켜야하는거지..
  내가 가지고 있는거 어떤 유저가 이벤트에 참가 했냐 아니냐. 그럼 그 이벤트가 클럽 내에서 만들어졌는지 확인하고 그 이벤트에 유저가 참여했는지 봐야하는거지.
  왜냐하면 어떤 클럽에서 나가면 그 클럽에서 만들어진 모임들에 대해 다 탈퇴해야되니까.

  */
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
  async deleteEvent(eventId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.eventJoin.deleteMany({
        where: {
          eventId: eventId,
        },
      }),
      this.prisma.eventCity.deleteMany({
        where: {
          eventId: eventId,
        },
      }),
      this.prisma.event.delete({
        where: {
          id: eventId,
        },
      }),
    ]);
  }
  async getClubWaitingList(clubId: number): Promise<number[]> {
    const clubWaiting = await this.prisma.clubWaiting.findMany({
      where: {
        clubId,
      },
    });

    return clubWaiting.map((clubWaiting) => clubWaiting.userId);
  }
  async isUserWaitingClub(clubId: number, userId: number): Promise<boolean> {
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
