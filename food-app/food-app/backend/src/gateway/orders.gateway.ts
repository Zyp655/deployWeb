import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      
      client.join(`user_${payload.sub}`);
      console.log(`Client connected: ${client.id} joined user_${payload.sub}`);

      if (payload.role === 'DRIVER') {
        client.join('drivers');
        console.log(`Client ${client.id} joined drivers room`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitOrderStatusUpdate(userId: string, orderId: string, status: string, note?: string) {
    this.server.to(`user_${userId}`).emit('order-status-updated', {
      orderId,
      status,
      note,
      timestamp: new Date().toISOString(),
    });
  }

  emitDriverAssigned(userId: string, orderId: string, driverInfo: {
    name: string;
    phone: string;
    vehiclePlate: string;
    vehicleType: string;
    rating: number;
  }) {
    this.server.to(`user_${userId}`).emit('driver-assigned', {
      orderId,
      driver: driverInfo,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToDrivers(event: string, payload: any) {
    this.server.to('drivers').emit(event, payload);
  }

  @SubscribeMessage('update-driver-location')
  handleDriverLocationUpdate(
    @MessageBody() data: { orderId: string; customerId: string; lat: number; lng: number }
  ) {
    if (!data.customerId) return;
    this.server.to(`user_${data.customerId}`).emit('driver-location-updated', {
      orderId: data.orderId,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('driver-toggle-online')
  async handleDriverToggleOnline(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return;
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });

      const profile = await this.prisma.driverProfile.findUnique({ where: { userId: payload.sub } });
      if (!profile) return;

      const updated = await this.prisma.driverProfile.update({
        where: { userId: payload.sub },
        data: { isOnline: !profile.isOnline },
      });

      client.emit('online-status-changed', { isOnline: updated.isOnline });
    } catch (e) {
      console.error('Error toggling driver online:', e);
    }
  }

  @SubscribeMessage('send-chat-message')
  async handleChatMessage(
    client: Socket,
    @MessageBody() data: { orderId: string; receiverId: string; content: string }
  ) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return;

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      const senderId = payload.sub;

      const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
      if (!order) return;

      if (order.userId !== senderId && order.driverId !== senderId) return;
      if (order.userId !== data.receiverId && order.driverId !== data.receiverId) return;

      const message = await this.prisma.chatMessage.create({
        data: {
          orderId: data.orderId,
          senderId,
          receiverId: data.receiverId,
          content: data.content,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } }
        }
      });

      this.server.to(`user_${data.receiverId}`).emit('chat-message-received', message);
      this.server.to(`user_${senderId}`).emit('chat-message-received', message);

    } catch (e) {
      console.error('Error handling chat message:', e);
    }
  }
}
