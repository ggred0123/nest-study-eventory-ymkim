import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewPayload } from './payload/create-review.payload';
import { ReviewDto, ReviewListDto } from './dto/review.dto';
import { CreateReviewData } from './type/create-review-data.type';
import { ReviewQuery } from './query/review.query';
import { UpdateReviewData } from './type/update-review-data.type';
import { PutUpdateReviewPayload } from './payload/put-update-review.payload';
import { PatchUpdateReviewPayload } from './payload/patch-update-review.payload';
import { UserBaseInfo } from '../auth/type/user-base-info.type';
import { ReviewData } from './type/review-data.type';
import { filter } from 'lodash';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async createReview(
    payload: CreateReviewPayload,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    const isReviewExist = await this.reviewRepository.isReviewExist(
      user.id,
      payload.eventId,
    );
    if (isReviewExist) {
      throw new ConflictException('해당 유저의 리뷰가 이미 존재합니다.');
    }

    const isUserJoinedEvent = await this.reviewRepository.isUserJoinedEvent(
      user.id,
      payload.eventId,
    );
    if (!isUserJoinedEvent) {
      throw new ConflictException('해당 유저가 이벤트에 참가하지 않았습니다.');
    }

    const event = await this.reviewRepository.getEventById(payload.eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }
    if (event.clubId) {
      const userInClub = await this.reviewRepository.isUserJoinedClub(
        user.id,
        event.clubId,
      );
      if (!userInClub) {
        throw new ConflictException('해당 유저가 클럽에 가입하지 않았습니다.');
      }
    }

    if (event.endTime > new Date()) {
      throw new ConflictException(
        'Event가 종료되지 않았습니다. 아직 리뷰를 작성할 수 없습니다.',
      );
    }

    if (event.hostId === user.id) {
      throw new ConflictException(
        '자신이 주최한 이벤트에는 리뷰를 작성 할 수 없습니다.',
      );
    }

    const createData: CreateReviewData = {
      userId: user.id,
      eventId: payload.eventId,
      score: payload.score,
      title: payload.title,
      description: payload.description,
    };

    const review = await this.reviewRepository.createReview(createData);

    return ReviewDto.from(review);
  }

  async getReviewById(
    reviewId: number,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    const review = await this.reviewRepository.getReviewById(reviewId);

    if (!review) {
      throw new NotFoundException('Review가 존재하지 않습니다.');
    }
    const event = await this.reviewRepository.getEventById(review.eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }
    if (event.clubId) {
      const userInClub = await this.reviewRepository.isUserJoinedClub(
        user.id,
        event.clubId,
      );
      if (!userInClub) {
        throw new ConflictException('해당 유저가 클럽에 가입하지 않았습니다.');
      }
    }

    return ReviewDto.from(review);
  }
  //

  async getReviews(
    query: ReviewQuery,
    user: UserBaseInfo,
  ): Promise<ReviewListDto> {
    const reviews = await this.reviewRepository.getReviews(query);
    const filteredReviews = await this.filterEventReviewInUserJoinedClub(
      reviews,
      user,
    );

    return ReviewListDto.from(filteredReviews);
  } // 내가 하고자 하는거.. 이게 보면 리뷰들 중에서도 클럽 안이벤트가 있고 그렇지 않은게 있을거야냐..
  //리뷰를 적은 이벤트가 클럽 안에서 만들어진거면 지금 조회를 하고 있는 유저가 그 클럽 안에 속한 사람인지 확인

  async filterEventReviewInUserJoinedClub(
    reviews: ReviewData[],
    user: UserBaseInfo,
  ) {
    const filteredReviews = reviews.filter(async (review) => {
      const event = await this.reviewRepository.getEventById(review.eventId);
      if (!event) {
        throw new NotFoundException('Event가 존재하지 않습니다.');
      }
      if (event.clubId) {
        const userInClub = await this.reviewRepository.isUserJoinedClub(
          user.id,
          event.clubId,
        );
        if (!userInClub) {
          return false;
        }
      }
      return true;
    });

    return filteredReviews;
  }

  async putUpdateReview(
    reviewId: number,
    payload: PutUpdateReviewPayload,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    await this.checkPermissionForModifyReview(reviewId, user.id);

    const updateData: UpdateReviewData = {
      score: payload.score,
      title: payload.title,
      description: payload.description ?? null,
    };

    const updatedReview = await this.reviewRepository.updateReview(
      reviewId,
      updateData,
    );

    return ReviewDto.from(updatedReview);
  }

  async patchUpdateReview(
    reviewId: number,
    payload: PatchUpdateReviewPayload,
    user: UserBaseInfo,
  ): Promise<ReviewDto> {
    if (payload.score === null) {
      throw new BadRequestException('score는 null이 될 수 없습니다.');
    }

    if (payload.title === null) {
      throw new BadRequestException('title은 null이 될 수 없습니다.');
    }

    await this.checkPermissionForModifyReview(reviewId, user.id);

    const updateData: UpdateReviewData = {
      score: payload.score,
      title: payload.title,
      description: payload.description,
    };

    const updatedReview = await this.reviewRepository.updateReview(
      reviewId,
      updateData,
    );

    return ReviewDto.from(updatedReview);
  }

  async deleteReview(reviewId: number, user: UserBaseInfo): Promise<void> {
    await this.checkPermissionForModifyReview(reviewId, user.id);

    await this.reviewRepository.deleteReview(reviewId);
  }

  private async checkPermissionForModifyReview(
    reviewId: number,
    userId: number,
  ): Promise<void> {
    const review = await this.reviewRepository.getReviewById(reviewId);

    if (!review) {
      throw new NotFoundException('Review가 존재하지 않습니다.');
    }

    const event = await this.reviewRepository.getEventById(review.eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }
    if (event.clubId) {
      const userInClub = await this.reviewRepository.isUserJoinedClub(
        userId,
        event.clubId,
      );
      if (!userInClub) {
        throw new ConflictException('해당 유저가 클럽에 가입하지 않았습니다.');
      }
    }

    if (review.userId !== userId) {
      throw new ConflictException('해당 리뷰를 삭제할 권한이 없습니다.');
    }
  }
}
