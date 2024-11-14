import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubData } from '../type/club-data.type';
import { IsOptional } from 'class-validator';

export class ClubDto {
  @ApiProperty({
    description: '리더 ID',
    type: Number,
  })
  leadId!: number;

  @ApiProperty({
    description: '클럽 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '클럽 이름',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: '클럽 설명',
    type: String,
  })
  description!: string;

  @ApiProperty({
    description: '최대 인원',
    type: Number,
  })
  maxPeople!: number;

  static from(club: ClubData): ClubDto {
    return {
      leadId: club.leadId,
      id: club.id,
      name: club.name,
      description: club.description,
      maxPeople: club.maxPeople,
    };
  }

  static fromArray(Clubs: ClubData[]): ClubDto[] {
    return Clubs.map((Club) => this.from(Club));
  }
}

export class ClubListDto {
  @ApiProperty({
    description: '모임 목록',
    type: [ClubDto],
  })
  Clubs!: ClubDto[];

  static from(Clubs: ClubData[]): ClubListDto {
    return {
      Clubs: ClubDto.fromArray(Clubs),
    };
  }
}
