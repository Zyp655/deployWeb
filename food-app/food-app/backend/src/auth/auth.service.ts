import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Nếu email tồn tại, mã OTP đã được gửi.' };
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordReset.create({
      data: {
        email: user.email,
        token: otpCode,
        expiresAt,
      },
    });

    try {
      const nodemailer = await import('nodemailer');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: `"HOANG FOOD" <${smtpUser}>`,
          to: user.email,
          subject: '🔐 Mã đặt lại mật khẩu — HOANG FOOD',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #eee;">
              <h2 style="text-align:center; color:#333;">🍜 HOANG FOOD</h2>
              <p>Xin chào <strong>${user.name}</strong>,</p>
              <p>Mã OTP đặt lại mật khẩu của bạn:</p>
              <div style="text-align:center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #F97316; background: #FFF7ED; padding: 16px 32px; border-radius: 12px; display: inline-block;">${otpCode}</span>
              </div>
              <p style="color:#666; font-size:14px;">Mã có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            </div>
          `,
        });
      } else {
        console.log(`[FORGOT-PASSWORD] OTP for ${email}: ${otpCode}`);
      }
    } catch (err) {
      console.log(`[FORGOT-PASSWORD] OTP for ${email}: ${otpCode}`);
    }

    return { message: 'Nếu email tồn tại, mã OTP đã được gửi.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const record = await this.prisma.passwordReset.findFirst({
      where: {
        email,
        token,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    await this.prisma.passwordReset.update({
      where: { id: record.id },
      data: { used: true },
    });

    return { message: 'Đặt lại mật khẩu thành công!' };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}

