import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateReviewData } from './type/create-review-data.type';
import { ReviewData } from './type/review-data.type';
import { User, Event } from '@prisma/client';
import { ReviewQuery } from './query/review.query';
import { UpdateReviewData } from './type/update-review-data.type';
import { EventData } from 'src/event/type/event-data.type';
import { ClubData } from 'src/club/type/club-data.type';
@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(data: CreateReviewData): Promise<ReviewData> {
    return this.prisma.review.create({
      data: {
        userId: data.userId,
        eventId: data.eventId,
        score: data.score,
        title: data.title,
        description: data.description,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }
  async getReviewsByEventIds(eventIds: number[]): Promise<ReviewData[]> {
    return this.prisma.review.findMany({
      where: {
        eventId: {
          in: eventIds,
        },
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async getClubIdsOfUser(userId: number): Promise<number[]> {
    const clubs = await this.prisma.clubJoin.findMany({
      where: {
        userId,
        club: {
          deletedAt: null,
        },
      },

      select: {
        clubId: true,
      },
    });
    return clubs.map((club) => club.clubId);
  }

  async getEventById(eventId: number): Promise<EventData | null> {
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
        clubId: true,
        createdAt: true,
        updatedAt: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
        club: {
          select: {
            id: true,
            deletedAt: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
      },
    });
  }
  async getEventsByEventIds(eventIds: number[]): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        id: {
          in: eventIds,
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        clubId: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
        club: {
          select: {
            id: true,
            deletedAt: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
      },
    });
  }

  async isReviewExist(userId: number, eventId: number): Promise<boolean> {
    const review = await this.prisma.review.findUnique({
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

    return !!review;
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

  async getReviewById(reviewId: number): Promise<ReviewData | null> {
    return this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async getReviews(query: ReviewQuery): Promise<ReviewData[]> {
    return this.prisma.review.findMany({
      where: {
        eventId: query.eventId,
        user: {
          deletedAt: null,
          id: query.userId,
        },
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async updateReview(
    reviewId: number,
    data: UpdateReviewData,
  ): Promise<ReviewData> {
    return this.prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        score: data.score,
        title: data.title,
        description: data.description,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async deleteReview(reviewId: number): Promise<void> {
    await this.prisma.review.delete({
      where: {
        id: reviewId,
      },
    });
  }

  async getClubByClubId(clubId: number): Promise<boolean> {
    const clubExist = this.prisma.club.findUnique({
      where: {
        id: clubId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        leadId: true,
        description: true,
        maxPeople: true,
        deletedAt: true,
      },
    });
    return !!clubExist;
  }

  async checkStartedEventInDeletedClub(eventId: number): Promise<boolean> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        startTime: {
          lt: new Date(),
        },
        club: {
          deletedAt: {
            not: null,
          },
        },
      },
      select: {
        club: {
          select: {
            deletedAt: true,
          },
        },
        startTime: true,
      },
    });

    return !!event;
  }
  async getUserJoinedEventIds(
    userId: number,
    eventIds: number[],
  ): Promise<number[]> {
    const eventJoins = await this.prisma.eventJoin.findMany({
      where: {
        userId: userId,
        eventId: { in: eventIds },
        user: {
          deletedAt: null,
        },
      },
      select: { eventId: true },
    });
    return eventJoins.map((eventJoin) => eventJoin.eventId);
  }
}
