import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('coupons')
export class CouponsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(@Body() body: { code: string; orderTotal: number }) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: body.code.toUpperCase() },
    });

    if (!coupon) throw new NotFoundException('Mã giảm giá không tồn tại');
    if (!coupon.isActive) throw new BadRequestException('Mã giảm giá đã hết hiệu lực');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Mã giảm giá đã hết hạn');
    if (coupon.usedCount >= coupon.usageLimit) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    if (body.orderTotal < coupon.minOrderValue) {
      throw new BadRequestException(`Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString()}đ`);
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = (body.orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: Math.round(discount),
      finalTotal: Math.round(body.orderTotal - discount),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getActiveCoupons() {
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      select: {
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minOrderValue: true,
        maxDiscount: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCoupon(@Body() data: any) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType || 'PERCENT',
        discountValue: Number(data.discountValue),
        minOrderValue: Number(data.minOrderValue || 0),
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
        usageLimit: Number(data.usageLimit || 100),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCoupon(@Param('id') id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
