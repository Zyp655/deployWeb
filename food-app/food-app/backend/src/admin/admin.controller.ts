import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, totalUsers, totalProducts] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        where: { createdAt: { gte: today } },
        select: { total: true }
      }),
      this.prisma.user.count(),
      this.prisma.product.count()
    ]);

    const revenueToday = todayOrders.reduce((sum, order) => sum + order.total, 0);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);
      
      const dayData = await this.prisma.order.aggregate({
        where: { createdAt: { gte: d, lt: nextD } },
        _count: { id: true },
        _sum: { total: true }
      });
      chartData.push({
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        orders: dayData._count.id,
        revenue: dayData._sum.total || 0
      });
    }

    return { totalOrders, revenueToday, totalUsers, totalProducts, chartData };
  }

  @Get('orders')
  async getOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: true
      }
    });
  }

  @Get('products')
  async getProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('products')
  async createProduct(@Body() data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        image: data.image || '/images/buncha.png',
        category: data.category
      }
    });
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() data: any) {
    if (data.price !== undefined) data.price = Number(data.price);
    return this.prisma.product.update({
      where: { id },
      data
    });
  }
}
