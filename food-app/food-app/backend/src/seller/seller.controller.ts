import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTAURANT)
export class SellerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, todayOrders, allOrders] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.findMany({
        where: { createdAt: { gte: today } },
        select: { total: true },
      }),
      this.prisma.order.count(),
    ]);

    const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const avgRating = await this.prisma.review.aggregate({ _avg: { rating: true } });

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayData = await this.prisma.order.aggregate({
        where: { createdAt: { gte: d, lt: nextD } },
        _count: { id: true },
        _sum: { total: true },
      });
      chartData.push({
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        orders: dayData._count.id,
        revenue: dayData._sum.total || 0,
      });
    }

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });
    const topProductDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await this.prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true },
        });
        return { name: product?.name || '', totalSold: tp._sum.quantity || 0 };
      }),
    );

    return {
      ordersToday: todayOrders.length,
      revenueToday,
      totalProducts,
      averageRating: avgRating._avg.rating || 0,
      totalOrders: allOrders,
      chartData,
      topProducts: topProductDetails,
    };
  }

  @Get('orders')
  async getOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
    });
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.order.update({
      where: { id },
      data: { status: body.status as any },
    });
  }

  @Get('products')
  async getProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orderItems: true, reviews: true } } },
    });
  }

  @Post('products')
  async createProduct(@Body() data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        image: data.image || '/images/default.jpg',
        category: data.category,
        isSpicy: data.isSpicy || false,
        isVegetarian: data.isVegetarian || false,
        calories: data.calories ? Number(data.calories) : null,
        tags: data.tags || [],
      },
    });
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() data: any) {
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.calories !== undefined) data.calories = data.calories ? Number(data.calories) : null;
    return this.prisma.product.update({ where: { id }, data });
  }
}
