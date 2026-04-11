import {
  Controller, Get, Patch, Body, UseGuards, Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new BadRequestException('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() body: { name?: string; phone?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('me/password')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(body.currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Mật khẩu hiện tại không đúng');

    if (body.newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.usersService.updatePassword(req.user.id, hashed);
    return { message: 'Đổi mật khẩu thành công' };
  }
}
