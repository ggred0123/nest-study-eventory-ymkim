import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { ClubRepository } from './club.repository';

@Module({
  controllers: [ClubController],
  providers: [ClubService, ClubRepository],
})
export class ClubModule {}
