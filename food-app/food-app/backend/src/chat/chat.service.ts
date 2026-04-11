import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrderChatHistory(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    if (order.userId !== userId && order.driverId !== userId) {
      throw new ForbiddenException('You are not authorized to view the chat for this order');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      }
    });

    return messages;
  }
}
