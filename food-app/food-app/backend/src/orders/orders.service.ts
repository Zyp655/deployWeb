import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';
import { OrdersGateway } from '../gateway/orders.gateway';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Lookup product prices to calculate total
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
    }

    const priceMap = new Map(products.map((p) => [p.id, p.price]));

    // Calculate total
    const total = dto.items.reduce((sum, item) => {
      const price = priceMap.get(item.productId) || 0;
      return sum + price * item.quantity;
    }, 0);

    // Build combined note from order note + per-item notes
    const itemNotes = dto.items
      .filter((item) => item.note)
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return `${product?.name}: ${item.note}`;
      });

    const combinedNote = [dto.note, ...itemNotes].filter(Boolean).join(' | ');

    // Create order + items + idempotency transaction in a single DB tx
    const idempotencyKey = uuidv4();

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        note: combinedNote || null,
        paymentMethod: dto.paymentMethod,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: priceMap.get(item.productId) || 0,
          })),
        },
        transactions: {
          create: {
            userId,
            amount: total,
            method: dto.paymentMethod,
            idempotencyKey,
          },
        },
        history: {
          create: {
            status: 'PENDING',
          },
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      note: order.note,
      address: dto.address,
      paymentMethod: dto.paymentMethod,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
    };
  }

  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      note: order.note,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
    }));
  }

  async findById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: { product: true },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      note: order.note,
      paymentMethod: order.paymentMethod,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        productImage: item.product.image,
        productCategory: item.product.category,
        quantity: item.quantity,
        price: item.price,
      })),
      history: order.history.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt,
      })),
      createdAt: order.createdAt,
    };
  }

  async updateStatus(orderId: string, status: OrderStatus, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        history: {
          create: {
            status,
            note,
          },
        },
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, status, note);

    return updated;
  }
}
