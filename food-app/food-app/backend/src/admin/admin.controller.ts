import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

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

  @Get('users')
  async getUsers(@Query('role') role?: string, @Query('blocked') blocked?: string) {
    const filters: any = {};
    if (role && Object.values(Role).includes(role as Role)) filters.role = role as Role;
    if (blocked === 'true') filters.isBlocked = true;
    if (blocked === 'false') filters.isBlocked = false;
    return this.usersService.findAll(filters);
  }

  @Patch('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    if (!Object.values(Role).includes(body.role as Role)) {
      throw new Error('Invalid role');
    }
    return this.usersService.updateRole(id, body.role as Role);
  }

  @Patch('users/:id/block')
  async toggleBlockUser(@Param('id') id: string, @Body() body: { isBlocked: boolean }) {
    return this.usersService.toggleBlock(id, body.isBlocked);
  }
}
