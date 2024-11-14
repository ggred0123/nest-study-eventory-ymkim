import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClubService } from './club.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClubDto } from './dto/club.dto';
import { CreateClubPayload } from './payload/create-club.payload';
import { PatchUpdateClubPayload } from './payload/patch-update-club.payload';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { DecideClubJoinPayload } from './payload/decide-club-join-payload';
import { EventDto } from 'src/event/dto/event.dto';
import { CreateEventPayload } from 'src/event/payload/create-event.payload';

@Controller('Clubs')
@ApiTags('Club API')
export class ClubController {
  constructor(private readonly ClubService: ClubService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽을 생성합니다' })
  @ApiCreatedResponse({ type: ClubDto })
  async createClub(
    @Body() payload: CreateClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubDto> {
    return this.ClubService.createClub(payload, user);
  }

  @Get(':ClubId')
  @ApiOperation({ summary: '클럽 상세 정보를 가져옵니다' })
  @ApiOkResponse({ type: ClubDto })
  async getClubById(
    @Param('ClubId', ParseIntPipe) ClubId: number,
  ): Promise<ClubDto> {
    return this.ClubService.getClubByClubId(ClubId);
  }

  /*@Get()
  @ApiOperation({ summary: '여러 모임 정보를 가져옵니다' })
  @ApiOkResponse({ type: ClubListDto })
  async getClubs(@Query() query: ClubQuery): Promise<ClubListDto> {
    return this.ClubService.getClubs(query);
  }
  */

  @Post(':ClubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 안에 모임을 만듭니다.' })
  @ApiCreatedResponse({ type: EventDto })
  async createClubEvent(
    @Param('ClubId', ParseIntPipe) clubId: number,
    @Body() payload: CreateEventPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<EventDto> {
    return this.ClubService.createClubEvent(clubId, payload, user);
  }

  @Post(':ClubId/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽에 참가합니다' })
  @ApiNoContentResponse()
  async joinClub(
    @Param('ClubId', ParseIntPipe) ClubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.joinClub(ClubId, user);
  }

  @Post(':ClubId/out')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저가 Club에서 나갑니다.' })
  @ApiNoContentResponse()
  async outClub(
    @Param('ClubId', ParseIntPipe) ClubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.outClub(ClubId, user);
  }

  @Patch(':ClubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽을 수정합니다' })
  @ApiOkResponse({ type: ClubDto })
  async patchUpdateClub(
    @Param('ClubId', ParseIntPipe) ClubId: number,
    @Body() payload: PatchUpdateClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubDto> {
    return this.ClubService.patchUpdateClub(ClubId, payload, user);
  }

  @Post(':ClubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 참여를 결정합니다.' })
  @ApiNoContentResponse()
  async decideClubJoin(
    @Param('ClubId', ParseIntPipe) ClubId: number,
    @Body() payload: DecideClubJoinPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.decideClubJoin(
      ClubId,
      user.id,
      payload.decision,
      user,
    );
  }

  @Post(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽리더를 변경합니다.' })
  @ApiNoContentResponse()
  async changeClubLead(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.changeClubLead(clubId, userId, user);
  }

  @Delete(':ClubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '클럽을 삭제합니다.' })
  @ApiNoContentResponse()
  async deleteClub(
    @Param('ClubId', ParseIntPipe) ClubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.deleteClub(ClubId, user);
  }
}
