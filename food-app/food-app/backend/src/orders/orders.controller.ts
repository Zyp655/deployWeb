import { Controller, Post, Get, Param, Body, UseGuards, Req, Patch, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderReviewDto } from './dto/create-order-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get('my')
  async findMyOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findMyOrders(req.user.id);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.findById(id, req.user.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới được đổi trạng thái đơn hàng');
    }
    return this.ordersService.updateStatus(id, dto.status, dto.note);
  }

  @Post(':id/review')
  async reviewOrder(
    @Param('id') id: string,
    @Body() dto: CreateOrderReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.reviewOrder(id, req.user.id, dto);
  }
}
