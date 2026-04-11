import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DriverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
  ) {}

  async getAvailableOrders() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PREPARED,
        driverId: null,
      },
      include: {
        store: { select: { name: true, address: true, phone: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async acceptOrder(driverId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.status !== OrderStatus.PREPARED || order.driverId !== null) {
      throw new BadRequestException('Đơn hàng này đã được nhận hoặc không ở trạng thái chờ tài xế');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: OrderStatus.DELIVERING,
        history: {
          create: { status: OrderStatus.DELIVERING, note: 'Tài xế đã nhận đơn và đang lấy hàng' }
        }
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, OrderStatus.DELIVERING, 'Tài xế đã nhận đơn');

    // Notify other drivers that this order is no longer available
    this.gateway.broadcastToDrivers('order-taken', { orderId });

    return updated;
  }

  async completeOrder(driverId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, driverId },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại hoặc bạn không phải người nhận đơn này');
    }

    if (order.status !== OrderStatus.DELIVERING) {
      throw new BadRequestException('Chỉ có thể hoàn thành đơn đang giao');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        history: {
          create: { status: OrderStatus.DELIVERED, note: 'Tài xế đã giao hàng thành công' }
        }
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, OrderStatus.DELIVERED, 'Giao hàng thành công');

    return updated;
  }

  async getMyOrders(driverId: string) {
    return this.prisma.order.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { name: true, address: true, phone: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
    });
  }
}
