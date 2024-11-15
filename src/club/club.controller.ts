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

@Controller('clubs')
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

  @Get(':clubId')
  @ApiOperation({ summary: '클럽 상세 정보를 가져옵니다' })
  @ApiOkResponse({ type: ClubDto })
  async getClubById(
    @Param('ClubId', ParseIntPipe) clubId: number,
  ): Promise<ClubDto> {
    return this.ClubService.getClubByClubId(clubId);
  }

  /*@Get()
  @ApiOperation({ summary: '여러 모임 정보를 가져옵니다' })
  @ApiOkResponse({ type: ClubListDto })
  async getClubs(@Query() query: ClubQuery): Promise<ClubListDto> {
    return this.ClubService.getClubs(query);
  }
  */

  @Post(':clubId/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽에 참가합니다' })
  @ApiNoContentResponse()
  async joinClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.joinClub(clubId, user);
  }

  @Post(':clubId/out')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저가 Club에서 나갑니다.' })
  @ApiNoContentResponse()
  async outClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.outClub(clubId, user);
  }

  @Patch(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽을 수정합니다' })
  @ApiOkResponse({ type: ClubDto })
  async patchUpdateClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: PatchUpdateClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubDto> {
    return this.ClubService.patchUpdateClub(clubId, payload, user);
  }

  @Post(':clubId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 참여를 결정합니다.' })
  @ApiNoContentResponse()
  async decideClubJoin(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: DecideClubJoinPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.approveClubJoin(
      clubId,
      user.id,
      payload.approve,
      user,
    );
  }

  @Post(':clubId/')
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

  @Delete(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '클럽을 삭제합니다.' })
  @ApiNoContentResponse()
  async deleteClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.ClubService.deleteClub(clubId, user);
  }
}
