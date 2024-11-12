import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserDto } from './dto/user.dto';

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
  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.deleteUser(userId);
  }
}
