import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId')
  @ApiOperation({ summary: '유저 정보 조회' })
  @ApiOkResponse({ type: UserDto })
  async getUserInfoById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserDto> {
    return this.userService.getUserInfoById(userId);
  }

  @Delete(':userId')
  @HttpCode(204)
  @ApiOperation({ summary: '유저 탈퇴' })
  @ApiNoContentResponse()
  async deleteUser(@Param('userId') userId: number): Promise<void> {
    return this.userService.deleteUser(userId);
  }
}
