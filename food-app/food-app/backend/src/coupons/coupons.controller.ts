import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, Query, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
  async validateCoupon(@Body() body: { code: string; orderTotal: number; storeId?: string }) {
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
    
    if (coupon.storeId && body.storeId && coupon.storeId !== body.storeId) {
      throw new BadRequestException('Mã giảm giá này không áp dụng cho quán ăn này');
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
  async getActiveCoupons(@Query('storeId') storeId?: string) {
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
          { OR: [{ storeId: null }, ...(storeId ? [{ storeId }] : [])] }
        ]
      },
      select: {
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minOrderValue: true,
        maxDiscount: true,
        expiresAt: true,
        storeId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  async getSellerCoupons(@Req() req: AuthenticatedRequest) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!store) throw new NotFoundException('Bạn chưa có cửa hàng');
    return this.prisma.coupon.findMany({ where: { storeId: store.id }, orderBy: { createdAt: 'desc' } });
  }

  @Post('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  async createSellerCoupon(@Req() req: AuthenticatedRequest, @Body() data: any) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!store) throw new NotFoundException('Bạn chưa có cửa hàng');
    
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
        storeId: store.id,
      },
    });
  }

  @Delete('seller/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  async deleteSellerCoupon(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!store) throw new NotFoundException('Bạn chưa có cửa hàng');
    
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Mã giảm giá không tồn tại');
    if (coupon.storeId !== store.id) throw new UnauthorizedException('Không có quyền xóa mã này');

    return this.prisma.coupon.delete({ where: { id } });
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
