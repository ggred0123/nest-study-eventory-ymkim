import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserDto } from './dto/user.dto';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { PatchUpdateUserPayload } from './payload/patch-update-user.payload';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserInfoById(userId: number): Promise<UserDto> {
    const user = await this.userRepository.getUserInfoById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserDto.from(user);
  }
  async deleteUser(userId: number, user: UserBaseInfo): Promise<void> {
    await this.checkRightUser(userId, user);
    return this.userRepository.deleteUser(userId);
  }
  async PatchUpdateUser(
    userId: number,
    payload: PatchUpdateUserPayload,
    user: UserBaseInfo,
  ): Promise<UserDto> {
    if (payload.name === null) {
      throw new BadRequestException('Name은 null이 될 수 없습니다.');
    }
    if (payload.email === null) {
      throw new BadRequestException('Email은 null이 될 수 없습니다.');
    }
    if (payload.birthday === null) {
      throw new BadRequestException('Birthday는 null이 될 수 없습니다.');
    }
    if (payload.cityId === null) {
      throw new BadRequestException('CityId는 null이 될 수 없습니다.');
    }
    if (payload.categoryId === null) {
      throw new BadRequestException('CategoryId는 null이 될 수 없습니다.');
    }

    await this.checkRightUser(userId, user);

    const updateData = {
      email: payload.email,
      name: payload.name,
      birthday: payload.birthday,
      cityId: payload.cityId,
      categoryId: payload.categoryId,
    };
    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateData,
    );

    return UserDto.from(updatedUser);
  }

  private async checkRightUser(
    userId: number,
    user: UserBaseInfo,
  ): Promise<void> {
    if (userId !== user.id) {
      throw new NotFoundException('해당 권한이 없습니다.');
    }
  }
}
